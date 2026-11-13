const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public_html/admin_preview.js'), 'utf8');
const ast = ts.createSourceFile('admin.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function ui(names, extra = {}) {
  const ctx = vm.createContext({ NANO_FRIEND_IDS: ['nano', 'toto', 'booki', 'mir'], ...extra }); ctx.window = ctx;
  for (const name of names) {
    const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === name);
    vm.runInContext(node.getText(ast), ctx);
  }
  return ctx;
}
test('학생의 저장된 선택을 우선하고 이름·아이디로 캐릭터를 임의 배정하지 않는다', () => {
  const ctx = ui(['getStudentCharacterId'], { NanoPortal: { remote: true }, localStorage: { getItem: () => 'mir' } });
  assert.equal(ctx.getStudentCharacterId({ characterId: 'booki', username: 'look1' }), 'booki');
  assert.equal(ctx.getStudentCharacterId({ name: '박진호', username: 'look1' }), 'nano');
  assert.equal(ctx.getStudentCharacterId({ name: '다른 학생', username: 'different' }), 'nano');
  assert.equal(ctx.getStudentCharacterId({ characterId: 'invalid' }), 'nano');
  ctx.NanoPortal.remote = false;
  assert.equal(ctx.getStudentCharacterId({ username: 'local' }), 'mir');
});
test('학생 서버 ID로 최신 선택·성장 단계를 적용하고 늦은 이전 조회는 무시한다', async () => {
  const pending = [], status = {}, renders = [];
  const ctx = ui(['refreshAdminRankingCharacters'], {
    adminRankCharacterRequest: 0, currentAcademyInfo: { id: 'A' }, document: { getElementById: () => status },
    studentDataList: [{ serverId: 's1', name: '동명' }, { serverId: 's2', name: '동명' }],
    renderAdminRankingView: skip => renders.push(skip),
    NanoPortal: { api: () => new Promise(resolve => pending.push(resolve)) }
  });
  const first = ctx.refreshAdminRankingCharacters(), second = ctx.refreshAdminRankingCharacters();
  pending[1]({ items: [{ memberId: 's2', characterId: 'booki', stage: 2 }, { memberId: 's1', characterId: 'toto', stage: 3 }] }); await second;
  pending[0]({ items: [{ memberId: 's1', characterId: 'mir', stage: 1 }] }); await first;
  assert.equal(ctx.studentDataList[0].characterId, 'toto'); assert.equal(ctx.studentDataList[0].characterStage, 3);
  assert.equal(ctx.studentDataList[1].characterId, 'booki'); assert.deepEqual(renders, [true]);
});
test('학원을 전환한 뒤 도착한 캐릭터 응답은 현재 학생 목록에 적용하지 않는다', async () => {
  let resolve;
  const ctx = ui(['refreshAdminRankingCharacters'], {
    adminRankCharacterRequest: 0, currentAcademyInfo: { id: 'A' }, document: { getElementById: () => ({}) },
    studentDataList: [{ serverId: 's1', characterId: 'nano' }], renderAdminRankingView() { throw Error('stale render'); },
    NanoPortal: { api: () => new Promise(done => { resolve = done; }) }
  });
  const task = ctx.refreshAdminRankingCharacters(); ctx.currentAcademyInfo.id = 'B';
  resolve({ items: [{ memberId: 's1', characterId: 'mir', stage: 3 }] }); await task;
  assert.equal(ctx.studentDataList[0].characterId, 'nano');
});
test('TOP 3 카드는 1~2명도 표시하고 캐릭터 단계·왕관·문자 이스케이프를 유지한다', () => {
  const ctx = ui(['escapeRankingText', 'renderAdminRankingPodium'], { getCharacterSvg: (id, size, stage) => `<svg data-id="${id}" data-stage="${stage}"></svg>` });
  const students = ['nano', 'toto', 'booki'].map((charId, i) => ({ charId, stage: i + 1, name: '<학생>', grade: '초등 3학년', points: 100, books: 4 }));
  for (const count of [0, 1, 2, 3]) {
    const html = ctx.renderAdminRankingPodium(students.slice(0, count));
    assert.equal((html.match(/<article /g) || []).length, count);
    assert.equal((html.match(/class="champion-crown"/g) || []).length, count ? 1 : 0);
    assert.ok(!html.includes('<학생>'));
  }
  assert.match(ctx.renderAdminRankingPodium(students), /data-id="booki" data-stage="3"/);
});
test('랭킹은 월별 독서량으로 캐릭터 단계를 변경하지 않는다', () => {
  const ctx = ui(['getStudentCharacterId', 'buildAdminRankingRows'], {
    NanoPortal: { remote: true }, getLoadedLearningLogs: () => [{ studentId: 'u1', date: '2026-10-01', score: 90 }],
    studentDataList: [{ id: 'u1', name: '학생', characterId: 'booki', characterStage: 3, bookCount: 1, points: 10 }]
  });
  assert.equal(ctx.buildAdminRankingRows('2026-10')[0].stage, 3);
  assert.equal(ctx.buildAdminRankingRows('2026-09')[0].stage, 3);
});
test('지난달·지지난달 드롭다운 변경 시 선택 월이 초기화되지 않고 현행 포인트 적립 기준으로 정확히 합산한다', () => {
  const periodSel = { value: '2026-09', options: [{ value: '2026-11' }, { value: '2026-10' }, { value: '2026-09' }], innerHTML: '' };
  const classSel = { value: 'all', options: [{ value: 'all' }], innerHTML: '' };
  const ctx = ui(['getAdminRankMonthOptions', 'populateAdminRankFilters', 'getStudentCharacterId', 'buildAdminRankingRows'], {
    adminRankMode: 'MONTH', adminRankPeriod: '2026-11', adminRankClass: 'all', academyClassList: [],
    document: { getElementById: id => id === 'adminRankPeriodSelect' ? periodSel : (id === 'adminRankClassSelect' ? classSel : null) },
    getLoadedLearningLogs: () => [
      { id: '1', studentId: 'u1', bookId: 'B1', grade: '초등 4학년', date: '2026-09-10', submittedAt: '2026-09-10T05:00:00Z', score: 100, correctCount: 5, thoughtAnswer: '재미있었다' }, // (5*3*1.2=18) + (5*1.2=6) = 24P
      { id: '2', studentId: 'u1', bookId: 'B1', grade: '초등 4학년', date: '2026-09-12', submittedAt: '2026-09-12T05:00:00Z', score: 80, correctCount: 4, thoughtAnswer: '' },             // 2회차: round(4*3*1.2)=14P
      { id: '3', studentId: 'u1', bookId: 'B1', grade: '초등 4학년', date: '2026-09-15', submittedAt: '2026-09-15T05:00:00Z', score: 100, correctCount: 5, thoughtAnswer: '세번째' },        // 3회차 초과: 0P
      { id: '4', studentId: 'u1', bookId: 'B2', grade: '초등 2학년', date: '2026-09-20', submittedAt: '2026-09-20T05:00:00Z', score: 40, correctCount: 2, thoughtAnswer: '미통과' },         // 60점 미만: 0P
      { id: '5', studentId: 'u1', bookId: 'B3', grade: '초등 2학년', date: '2026-10-05', submittedAt: '2026-10-05T05:00:00Z', score: 80, correctCount: 4, thoughtAnswer: '생각' }            // 지난달(10월): 4*3 + 5 = 17P
    ],
    studentDataList: [{ id: 'u1', username: 'u1', name: '김나노', characterId: 'nano', characterStage: 2, grade: '초등 4학년', classGroup: 'A반' }]
  });
  ctx.populateAdminRankFilters();
  assert.equal(ctx.adminRankPeriod, '2026-09');
  assert.equal(periodSel.value, '2026-09');

  const sepRows = ctx.buildAdminRankingRows();
  assert.equal(sepRows[0].points, 38); // 24P + 14P + 0P + 0P = 38P
  assert.equal(sepRows[0].books, 1);   // 고유 인증 도서 B1 1권

  const octRows = ctx.buildAdminRankingRows('2026-10');
  assert.equal(octRows[0].points, 17); // 12P + 5P = 17P
  assert.equal(octRows[0].books, 1);   // 고유 인증 도서 B3 1권
});

function load(file, deps) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] || require(name), console });
  return exports;
}
test('캐릭터 API는 소속 학생의 선택만 조회하고 학생 화면과 같은 성장 규칙을 적용한다', async () => {
  const http = load('lib/portal-http.ts', { './prisma': {}, './portal-auth': {} });
  let user = { role: 'TEACHER', academyId: 'a1' }, lookups = 0;
  const db = {
    member: { findMany: async ({ where }) => { lookups++; assert.equal(where.academyId, 'a1'); assert.equal(where.status, 'APPROVED'); return [{ id: 's1' }, { id: 's2' }]; } },
    portalSetting: { findMany: async ({ where }) => { assert.deepEqual(Array.from(where.key.in), ['character:s1', 'character:s2']); return [{ key: 'character:s1', value: { characterId: 'booki' } }]; } }
  };
  const run = load('api/activity.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': { ...http, authenticate: async () => user, academyScope: async (u, code) => { if (code !== 'A') http.master(u); return u.academyId; } },
    '../lib/portal-learning': { readingProgress: async () => new Map([['s1', { natureRead: 100, totalRead: 100 }], ['s2', { totalRead: 30 }]]) }
  }).default;
  const response = () => ({ code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } });
  const req = { method: 'GET', query: { action: 'characters', academy: 'A' } }, res = response();
  await run(req, res);
  assert.equal(res.code, 200); assert.equal(res.data.items[0].characterId, 'booki'); assert.equal(res.data.items[0].stage, 2);
  assert.equal(res.data.items[1].characterId, 'nano'); assert.equal(res.data.items[1].stage, 2);
  const denied = response(); await run({ ...req, query: { ...req.query, academy: 'OTHER' } }, denied); assert.equal(denied.code, 403);
  user = { ...user, role: 'STUDENT' }; const student = response(); await run(req, student); assert.equal(student.code, 403); assert.equal(lookups, 1);
});

test('북퀴즈 추천은 60점 이상에서 활성화되고 9종 고유 반응과 성장 외형을 보존한다', () => {
  const artCtx = {};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public_html/js/reading-progress.js'), 'utf8'), artCtx);
  vm.runInNewContext(fs.readFileSync(path.join(root, 'public_html/js/quiz-result-art.js'), 'utf8'), artCtx);
  const NanoQuizResult = artCtx.NanoQuizResult;
  const book = { id: 'FA000003', bookNo: 'FA000003', title: '오즈의 마법사', readingGenre: 'fiction' };

  // 1) 60점 미만(0, 40, 59점)에서는 비활성화(disabled)
  for (const lowScore of [0, 40, 59]) {
    const html = NanoQuizResult.render(lowScore, 'nano', book, { stage: 1 });
    assert.ok(html.includes('id="btnQuizRecommend"'), `${lowScore}점 추천 버튼 렌더링 확인`);
    assert.ok(html.includes('is-disabled') && html.includes('disabled aria-disabled="true"'), `${lowScore}점은 비활성화되어야 함`);
    assert.ok(!html.includes('onclick="handleQuizBookRecommend(this)"'), `${lowScore}점은 클릭 핸들러가 없어야 함`);
  }

  // 2) 60점 이상(60, 80, 100점)에서는 활성화
  for (const passScore of [60, 80, 100]) {
    const html = NanoQuizResult.render(passScore, 'nano', book, { stage: 2 });
    assert.ok(html.includes('id="btnQuizRecommend"'), `${passScore}점 추천 버튼 렌더링 확인`);
    assert.ok(!html.includes('disabled aria-disabled="true"'), `${passScore}점은 활성화되어야 함`);
    assert.ok(html.includes('onclick="handleQuizBookRecommend(this)"'), `${passScore}점은 클릭 핸들러가 있어야 함`);
  }

  // 3) 이미 추천 완료한 도서는 추천 완료 상태 표시
  const recHtml = NanoQuizResult.render(80, 'nano', book, { stage: 2, isRecommended: true });
  assert.ok(recHtml.includes('is-recommended') && recHtml.includes('추천 완료'));

  // 4) 기존 저장 ID와 27개 성장 외형을 유지하며 각 캐릭터가 고유한 추천 반응을 보여 줍니다.
  const allFriends = ['nano', 'toto', 'booki', 'pico', 'popo', 'chichi', 'lumi', 'mir', 'jelly'];
  assert.deepEqual(Object.keys(NanoQuizResult.characters), allFriends);
  const studentHtml = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');
  const quizCss = fs.readFileSync(path.join(root, 'public_html/css/quiz-result.css'), 'utf8');
  assert.equal(NanoQuizResult.characters.lumi.name, '냥이');
  assert.equal(NanoQuizResult.characters.jelly.name, '양양');
  assert.equal(new Set([...quizCss.matchAll(/--friend-celebrate:\s*(\w+)/g)].map(match => match[1])).size, 9);
  assert.match(quizCss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(quizCss, /animation: none !important/);
  assert.match(recHtml, /aria-pressed="true"/);
  assert.match(recHtml, /추천을 취소하려면 다시 눌러 주세요/);

  for (const fid of allFriends) {
    assert.ok(new RegExp(`\\b${fid}\\s*:`).test(studentHtml.split('CHAR_RECOMMEND_REACTIONS')[1]), `${fid} 추천 기쁨 대사 존재 확인`);
    assert.equal(new Set([1, 2, 3].map(stage => NanoQuizResult.avatar(fid, 100, stage))).size, 3);
    for (const stg of [1, 2, 3]) {
      const avatar = NanoQuizResult.avatar(fid, 100, stg);
      assert.ok(avatar.includes('role="img"') && avatar.includes('aria-label="' + NanoQuizResult.characters[fid].name + ' ' + stg + '단계"'));
      for (const score of [0, 60, 80, 100]) assert.ok(NanoQuizResult.render(score, fid, book, { stage: stg }).includes('data-stage="' + stg + '"'));
      const rendered = NanoQuizResult.render(80, fid, book, { stage: stg });
      assert.ok(rendered.includes(`data-friend="${fid}"`), `${fid} 캐릭터 식별자 확인`);
      assert.ok(rendered.includes('class="qr-eyes-joy"'), `${fid} ${stg}단계 반달 눈웃음 파츠 확인`);
      assert.ok(rendered.includes('class="qr-arms-joy"'), `${fid} ${stg}단계 고유 제스처 확인`);
      assert.ok(rendered.includes('class="qr-signature-effect qr-effect-' + fid + '"'), `${fid} ${stg}단계 고유 추천 효과 확인`);
      assert.ok(!rendered.includes('qr-joy-burst') && !rendered.includes('qr-joy-thumb-badge'), '공통 하트·따봉 폭죽을 사용하지 않음');
    }
  }
});

test('추천 API는 60점 이상 인증 도서만 허용하며 기존 마스터 추천 수 위에 중복 없이 누적한다', async () => {
  const http = load('lib/portal-http.ts', { './prisma': {}, './portal-auth': {} });
  const user = { id: 'stu-1', role: 'STUDENT', academyId: 'a1' };
  const store = new Map([
    ['legacy_book_social_stats', { key: 'legacy_book_social_stats', scope: 'system', value: { recommends: { FA000003: 39, FA000001: 20 } } }]
  ]);
  let passAttempt = null;

  const db = {
    book: {
      findFirst: async ({ where }) => {
        const q = where.OR[0].bookNo;
        if (q === 'FA000003') return { id: 'book-uuid-3', bookNo: 'FA000003', isRecommended: false };
        return null;
      }
    },
    quizAttempt: {
      findFirst: async ({ where }) => {
        assert.equal(where.memberId, 'stu-1');
        assert.equal(where.score.gte, 60);
        return passAttempt;
      }
    },
    portalSetting: {
      findUnique: async ({ where }) => store.get(where.key) || null,
      findMany: async ({ where }) => Array.from(store.values()).filter(r => r.scope === where.scope),
      create: async ({ data }) => {
        if (store.has(data.key)) throw Object.assign(Error('Unique key'), { code: 'P2002' });
        const next = { ...data, revision: 1 };
        store.set(data.key, next);
        return next;
      },
      updateMany: async ({ where, data }) => {
        const prev = store.get(where.key);
        if (!prev || prev.revision !== where.revision) return { count: 0 };
        store.set(where.key, { ...prev, scope: data.scope, value: data.value, revision: prev.revision + data.revision.increment });
        return { count: 1 };
      }
    }
  };

  const run = load('api/activity.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': { ...http, authenticate: async () => user },
    '../lib/portal-learning': {}
  }).default;
  const response = () => ({ code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } });

  // 1) 60점 이상 인증 이력이 없는 경우(예: 40점) -> 403 차단 및 기존 추천 수(39) 변동 없음
  const denied = response();
  await run({ method: 'POST', query: { action: 'recommend' }, body: { bookId: 'FA000003' } }, denied);
  assert.equal(denied.code, 403);

  // 2) 60점 이상 인증 통과 후 추천 클릭 -> 기존 39 + 신규 1 = 40으로 누적!
  passAttempt = { id: 'att-pass-1' };
  const ok1 = response();
  await run({ method: 'POST', query: { action: 'recommend' }, body: { bookId: 'FA000003' } }, ok1);
  assert.equal(ok1.code, 200);
  assert.equal(ok1.data.alreadyRecommended, false);
  assert.equal(ok1.data.recommends, 40);
  assert.equal(store.get('legacy_book_social_stats').value.recommends.FA000003, 39); // 기존 마이그레이션 원본 훼손 없음

  // 3) 같은 학생이 또 눌러도 중복 증가 없이 40 유지
  const ok2 = response();
  await run({ method: 'POST', query: { action: 'recommend' }, body: { bookId: 'FA000003' } }, ok2);
  assert.equal(ok2.code, 200);
  assert.equal(ok2.data.alreadyRecommended, true);
  assert.equal(ok2.data.recommends, 40);
});


test('학생 랭킹 목록은 독서왕 딱지 없이 이름(아이디)·학급명·포인트(완독 권수)를 표시하고 전국 랭킹에서만 이름 위에 학원명을 노출한다', () => {
  const html = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');
  const scriptMatch = html.match(/function renderRank\(\) \{[\s\S]*?\n\}/);
  assert.ok(scriptMatch, 'student_preview.html에 renderRank 함수가 있어야 합니다');
  const escapeMatch = html.match(/function escapeStudentQuizText\([\s\S]*?\n\}/);
  assert.ok(escapeMatch, 'student_preview.html에 escapeStudentQuizText 함수가 있어야 합니다');

  const elements = { rankList: { innerHTML: '', textContent: '' } };
  const rowsData = [
    { rank: 1, name: '박진호', username: 'look1', className: 'A Class', academyName: '주식회사 루크러닝', pt: 83, books: 4, me: true, charId: 'nano', stage: 1 },
    { rank: 2, name: '<김빵빵>', username: 'bbang<1>', className: '', academyName: '행복학원', pt: 0, books: 0, me: false, charId: 'nano', stage: 1 }
  ];
  const ctx = vm.createContext({
    window: {},
    document: { getElementById: id => elements[id] || null },
    currentRankScope: 'academy',
    currentRankPeriod: 'month',
    fullRankDatabase: {
      academy: { month: rowsData.map(r => ({ ...r })) },
      national: { month: rowsData.map(r => ({ ...r })) }
    },
    checkAcademyClassMode() {},
    updateAllCharacterAvatars() {},
    updateRankingHeaderTexts() {},
    clearRankPodium() {},
    getUserCharacterId: () => 'nano',
    getCharacterSvg: () => '<svg></svg>'
  });
  vm.runInContext(escapeMatch[0] + '\n' + scriptMatch[0], ctx);

  // 1) 학원 전체 랭킹: 독서왕 딱지 없음, 이름 위 학원명 없음, 이름(아이디) + 학급명 + 포인트(완독 권수)
  ctx.renderRank();
  const academyHtml = elements.rankList.innerHTML;
  assert.equal(academyHtml.includes('독서왕'), false, '랭킹 목록 카드에 독서왕 딱지가 남아있으면 안 됩니다');
  assert.equal(academyHtml.includes('rank-card-academy'), false, '학원 전체 랭킹에서는 이름 위에 학원명을 표시하지 않습니다');
  assert.match(academyHtml, /<span>박진호<\/span><span class="rank-card-id">\(look1\)<\/span><span class="rank-card-class">A Class<\/span><span class="rank-card-me">나<\/span>/);
  assert.match(academyHtml, /<span class="rank-card-class">학급 미지정<\/span>/);
  assert.match(academyHtml, /83<span class="rank-card-pt-unit">P<\/span><\/span><span class="rank-card-books">\(완독 4권\)<\/span>/);
  assert.equal(academyHtml.includes('<김빵빵>') || academyHtml.includes('<1>'), false, 'XSS 위험 문자는 이스케이프되어야 합니다');

  // 2) 전국 랭킹: 학원명이 이름(.rank-card-title)보다 위에 배치됨
  ctx.currentRankScope = 'national';
  ctx.renderRank();
  const nationalHtml = elements.rankList.innerHTML;
  const acadIdx = nationalHtml.indexOf('rank-card-academy');
  const titleIdx = nationalHtml.indexOf('rank-card-title');
  assert.ok(acadIdx !== -1 && acadIdx < titleIdx, '전국 랭킹에서는 학원명이 이름보다 먼저(위에) 렌더링되어야 합니다');
  assert.ok(nationalHtml.includes('주식회사 루크러닝'), '전국 랭킹에 학원명이 표시되어야 합니다');
  assert.equal(nationalHtml.includes('독서왕'), false);
});
