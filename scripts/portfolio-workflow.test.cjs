const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
function load(file, deps = {}, extra = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] || require(name), console, process, URL, AbortSignal, ...extra });
  return exports;
}
const http = load('lib/portal-http.ts', { './prisma': { prisma: {} }, './portal-auth': {} });
const learning = load('lib/portal-learning.ts');
const teacher = { id: 't1', role: 'TEACHER', academyId: 'a1', academy: { code: 'A' } };
function handler(file, db, extra = {}, user = teacher) {
  return load(file, {
    '../lib/prisma': { prisma: db }, '../lib/portal-auth': {}, '../lib/portal-learning': learning,
    '../lib/portal-http': { ...http, authenticate: async () => user, academyScope: async (u, code) => { if (code && code !== 'A') http.master(u); return u.academyId; } }
  }, extra).default;
}
function response() { return { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } }; }
function manageRequest(entity, data) { return { method: 'POST', query: { entity }, body: { operation: 'save', data } }; }
function assignmentDB(fail = false) {
  const rows = [{ academyId: 'a1', memberId: 's1', bookId: 'b1', isCompleted: true }];
  return {
    rows,
    book: { findFirst: async ({ where }) => ['b1', 'b2'].includes(where.OR[0].id) ? { id: where.OR[0].id } : null },
    classGroup: { findFirst: async ({ where }) => where.id === 'c1' && where.academyId === 'a1' ? { id: 'c1' } : null },
    member: { findMany: async ({ where }) => { assert.equal(where.academyId, 'a1'); assert.equal(where.classGroupId, 'c1'); assert.equal(where.status, 'APPROVED'); return [{ id: 's2' }, { id: 's1' }]; } },
    async $transaction(fn) {
      const staged = rows.slice();
      const result = await fn({ $queryRaw: async () => [], bookAssignment: {
        findFirst: async ({ where }) => staged.find(row => Object.keys(where).every(key => row[key] === where[key])),
        create: async ({ data }) => { if (fail && data.memberId === 's2') throw Error('DB failure'); staged.push(data); }
      } });
      rows.splice(0, rows.length, ...staged);
      return result;
    }
  };
}
test('학급 여러 도서는 서버에 모두 저장되며 재시도·완료된 배정은 중복되지 않는다', async () => {
  const db = assignmentDB(), run = handler('api/manage.ts', db);
  const req = manageRequest('assignments', { classGroupId: 'c1', bookIds: ['b1', 'b2', 'b2'] });
  const first = response(); await run(req, first);
  assert.equal(first.code, 200); assert.equal(first.data.addedCount, 3); assert.equal(db.rows.length, 4);
  const second = response(); await run(req, second);
  assert.equal(second.data.addedCount, 0); assert.equal(db.rows.length, 4);
  assert.equal(db.rows[0].isCompleted, true);
});
test('학급 배정 도중 실패하면 부분 저장하지 않으며 다른 학급·없는 도서를 거부한다', async () => {
  const db = assignmentDB(true), run = handler('api/manage.ts', db);
  const res = response(); await run(manageRequest('assignments', { classGroupId: 'c1', bookIds: ['b1', 'b2'] }), res);
  assert.equal(res.code, 500); assert.equal(db.rows.length, 1);
  for (const data of [{ classGroupId: 'other', bookIds: ['b1'] }, { classGroupId: 'c1', bookIds: ['b1', 'missing'] }]) {
    const denied = response(); await run(manageRequest('assignments', data), denied);
    assert.ok(denied.code >= 400); assert.equal(db.rows.length, 1);
  }
});

const generated = { achievements: [{ index: 1, comment: '두 번째 도서 성취' }, { index: 0, comment: '첫 번째 도서 성취' }], comments: ['독서 이야기 하나', '독서 이야기 둘', '독서 이야기 셋'], teacherNote: '근거 기반 지도교사 총평' };
function portfolioDB(options = {}) {
  const row = { key: 'pf_1', scope: 'portfolio:a1', revision: 3, value: {
    memberId: 's1', name: '개인 이름', title: '리포트', from: '2026-10-01', to: '2026-10-30', comment: '',
    books: [{ bookId: 'b1', title: '책 하나', author: '저자 하나', score: 80, thought: '학생 답안' }, { bookId: 'b2', title: '책 둘', score: 0 }]
  } };
  return {
    row, updates: 0,
    member: { findFirst: async ({ where }) => where.academyId === 'a1' ? { id: 's1', grade: '초등 4학년' } : null },
    book: { findMany: async () => [{ id: 'b1', bookNo: 'FA01', title: '책 하나', author: '저자 하나', description: '친구와 함께 문제를 해결하는 줄거리' }, { id: 'b2', bookNo: 'FA02', title: '책 둘', author: '저자 둘', description: null }] },
    portalSetting: {
      findFirst: async ({ where }) => where.key === row.key && where.scope === row.scope ? structuredClone(row) : null,
      findUnique: async () => ({ value: { apiKey: options.noKey ? '' : 'test-only-placeholder', model: 'configured-test-model' } }),
      updateMany: async ({ where, data }) => {
        if (options.conflict || where.revision !== row.revision) return { count: 0 };
        row.value = structuredClone(data.value); row.revision++; return { count: 1 };
      }
    }
  };
}
function aiFetch(output = generated) { return async () => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(output) }] } }] }) }); }
const aiRequest = { method: 'POST', body: { portfolioId: 'pf_1', academy: 'A', books: [{ title: '위조 도서', score: 100 }] } };
test('AI는 등록 키·모델과 서버 도서·줄거리·점수로 세 영역을 생성하고 재열람 결과를 재사용한다', async () => {
  const db = portfolioDB(); let calls = 0;
  const run = handler('api/portfolio-ai.ts', db, { fetch: async (url, options) => {
    calls++;
    assert.ok(url.includes('configured-test-model')); assert.ok(!url.includes('key='));
    assert.equal(options.headers['x-goog-api-key'], 'test-only-placeholder');
    const request = JSON.parse(options.body), input = JSON.parse(request.contents[0].parts[0].text);
    assert.equal(input.books[0].synopsis, '친구와 함께 문제를 해결하는 줄거리');
    assert.equal(input.books[1].synopsis, ''); assert.equal(input.books[1].score, 0);
    assert.ok(!options.body.includes('위조 도서')); assert.ok(!options.body.includes('개인 이름'));
    return aiFetch()();
  } });
  const first = response(); await run(aiRequest, first);
  assert.equal(first.code, 200); assert.equal(db.row.revision, 4);
  assert.equal(db.row.value.books[0].achievement, '첫 번째 도서 성취');
  assert.equal(db.row.value.books[1].achievement, '두 번째 도서 성취');
  assert.equal(db.row.value.books[0].thought, '학생 답안');
  assert.equal(db.row.value.aiTeacherNote, generated.teacherNote);
  assert.deepEqual(db.row.value.aiComments, generated.comments);
  const next = response(); await run(aiRequest, next);
  assert.equal(next.data.cached, true); assert.equal(calls, 1);
});
test('다른 학원·학생 권한·없는 발급본은 AI 호출 전에 거부한다', async () => {
  const db = portfolioDB(); let calls = 0;
  for (const [user, body, code] of [
    [teacher, { portfolioId: 'other', academy: 'A' }, 404],
    [teacher, { portfolioId: 'pf_1', academy: 'OTHER' }, 403],
    [{ ...teacher, role: 'STUDENT' }, aiRequest.body, 403]
  ]) {
    const res = response();
    await handler('api/portfolio-ai.ts', db, { fetch: async () => { calls++; } }, user)({ method: 'POST', body }, res);
    assert.equal(res.code, code);
  }
  assert.equal(calls, 0);
});
test('AI 키 누락·오류·비정상 출력·동시 수정은 기존 발급본을 보존한다', async () => {
  const duplicate = { ...generated, achievements: [{ index: 0, comment: '하나' }, { index: 0, comment: '중복' }] };
  for (const [options, fetcher, code] of [
    [{ noKey: true }, aiFetch(), 503],
    [{}, async () => { throw Error('sensitive-provider-detail'); }, 502],
    [{}, aiFetch({ ...generated, teacherNote: '<script>alert(1)</script>' }), 502],
    [{}, aiFetch(duplicate), 502],
    [{ conflict: true }, aiFetch(), 409]
  ]) {
    const db = portfolioDB(options), before = JSON.stringify(db.row);
    const res = response(); await handler('api/portfolio-ai.ts', db, { fetch: fetcher })(aiRequest, res);
    assert.equal(res.code, code); assert.equal(JSON.stringify(db.row), before);
    assert.ok(!JSON.stringify(res.data).includes('sensitive-provider-detail'));
  }
});
test('총평 수동 편집은 선택 도서와 AI 분석을 유지한다', async () => {
  const db = portfolioDB(); db.row.value.aiComments = generated.comments;
  const res = response(); await handler('api/manage.ts', db)(manageRequest('portfolios', { id: 'pf_1', revision: 3, comment: '직접 쓴 총평' }), res);
  assert.equal(res.code, 200); assert.equal(db.row.value.books.length, 2);
  assert.deepEqual(db.row.value.aiComments, generated.comments);
  assert.equal(db.row.value.commentSource, 'teacher'); assert.equal(db.row.value.comment, '직접 쓴 총평');
});

function ui(names, extra = {}) {
  const source = fs.readFileSync(path.join(root, 'public_html/admin_preview.js'), 'utf8');
  const ast = ts.createSourceFile('admin.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const ctx = vm.createContext({ console, ...extra }); ctx.window = ctx;
  for (const name of names) {
    const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === name);
    assert.ok(node, name); vm.runInContext(node.getText(ast), ctx);
  }
  return ctx;
}
test('포트폴리오 이름·학년 정리와 AI 텍스트의 HTML 이스케이프', () => {
  const ctx = ui(['formatPortfolioTeacher', 'formatPortfolioSchoolGrade', 'escapePortfolioText']);
  assert.equal(ctx.formatPortfolioTeacher('김선생 지도교사'), '김선생');
  assert.equal(ctx.formatPortfolioTeacher('김선생 지도 교사 '), '김선생');
  assert.equal(ctx.formatPortfolioSchoolGrade('나노초등학교 초등 4학년'), '나노초등학교 4학년');
  assert.equal(ctx.formatPortfolioSchoolGrade('중앙초등학교 초등학교 2학년'), '중앙초등학교 2학년');
  assert.equal(ctx.escapePortfolioText('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
});
test('일괄 배정 UI는 서버 응답을 기다리고 실패하면 선택을 유지한다', async () => {
  for (const fail of [false, true]) {
    const notices = [], order = [], button = { innerHTML: '배정' };
    const ctx = ui(['executeBatchClassAssign'], {
      batchClassAssignSaving: false, batchSelectedClassName: '학급', batchSelectedBooks: [{ id: 'b1' }],
      academyClassList: [{ name: '학급', serverId: 'c1' }], studentDataList: [{ classGroup: '학급' }], currentAcademyInfo: { id: 'A' },
      confirm: () => true, showAcademyToast: message => notices.push(message), document: { getElementById: () => button },
      $: () => ({ modal: () => order.push('close') }),
      NanoPortal: { remote: true, saveClassAssignments: async () => { order.push('save'); await Promise.resolve(); if (fail) throw Error('실패'); return { count: 1, addedCount: 1 }; }, refreshAssignments: async () => order.push('refresh') }
    });
    await Promise.all([ctx.executeBatchClassAssign(), ctx.executeBatchClassAssign()]);
    assert.deepEqual(order, fail ? ['save'] : ['save', 'close', 'refresh']);
    assert.equal(button.disabled, false); assert.equal(ctx.batchSelectedBooks.length, 1);
    assert.match(notices[0], fail ? /선택한 도서를 유지/ : /저장 완료/);
  }
});
test('늦은 AI 응답은 다른 학생 화면을 덮어쓰지 않고 실패 시 재시도 상태를 유지한다', async () => {
  const renders = [], data = {};
  const ctx = ui(['requestGeminiPortfolioStory'], {
    currentViewingPortfolioId: 'pf_other', renderPortfolioDocument: (...args) => renders.push(args),
    NanoPortal: { remote: true, generatePortfolioAI: async () => { throw Error('키 확인 필요'); }, refreshPortfolios: async () => {} }
  });
  await ctx.requestGeminiPortfolioStory('s1', 'pf_1', data);
  assert.equal(renders.length, 0); assert.equal(data._aiPending, false); assert.equal(data._aiError, '키 확인 필요');
  data._aiRequested = false; ctx.currentViewingPortfolioId = 'pf_1';
  await ctx.requestGeminiPortfolioStory('s1', 'pf_1', data);
  assert.equal(renders.length, 1);
});

test('저장된 AI 분석은 클라이언트 재조회와 리포트 렌더링에서도 세 영역 모두 유지된다', async () => {
  const item = { ...portfolioDB().row.value, id: 'pf_1', aiVersion: 1, aiComments: generated.comments, aiTeacherNote: generated.teacherNote };
  item.books = item.books.map((book, index) => ({ ...book, achievement: generated.achievements.find(a => a.index === index).comment }));
  const student = { id: 'S1', serverId: 's1', name: '학생', school: '나노초등학교', grade: '초등 4학년', teacher: '김선생 지도교사', classGroup: '학급' };
  const ctx = vm.createContext({
    location: { protocol: 'https:', hostname: 'test.example', pathname: '/index.html' }, document: { readyState: 'loading' },
    addEventListener() {}, URLSearchParams, AbortSignal, currentAcademyInfo: { id: 'A' },
    portfolioList: [], portfolioDataMap: {}, studentDataList: [student], academyBookList: [],
    fetch: async () => ({ ok: true, json: async () => ({ items: [item] }) })
  });
  ctx.window = ctx;
  vm.runInContext(fs.readFileSync(path.join(root, 'public_html/js/portal-client.js'), 'utf8'), ctx);
  await ctx.NanoPortal.refreshPortfolios();
  assert.equal(ctx.portfolioDataMap.pf_1.books[0].achievement, '첫 번째 도서 성취');
  assert.equal(ctx.portfolioDataMap.pf_1.teacherNote, generated.teacherNote);
  const document = { innerHTML: '' };
  const view = ui(['renderPortfolioDocument', 'generatePortfolioInsights', 'escapePortfolioText', 'formatPortfolioSchoolGrade', 'formatPortfolioTeacher'], {
    document: { getElementById: () => document }, portfolioList: ctx.portfolioList, portfolioDataMap: ctx.portfolioDataMap,
    studentDataList: [student], academyBookList: [], requestGeminiPortfolioStory() {}, buildGenreDonutSvg: () => '',
    NanoPortal: { remote: true }
  });
  view.renderPortfolioDocument('S1', 'pf_1');
  assert.match(document.innerHTML, /나노초등학교 4학년/);
  assert.match(document.innerHTML, /학급 · 김선생<\/strong>/);
  assert.match(document.innerHTML, /첫 번째 도서 성취/);
  assert.match(document.innerHTML, /독서 이야기 하나/);
  assert.match(document.innerHTML, /근거 기반 지도교사 총평/);
  item.comment = '직접 작성'; item.commentSource = 'teacher';
  await ctx.NanoPortal.refreshPortfolios();
  assert.equal(ctx.portfolioDataMap.pf_1.teacherNote, '직접 작성');
});
