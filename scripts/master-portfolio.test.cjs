const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const { createRequire } = require('node:module');

process.env.PORTAL_AUTH_SECRET = 'test-only-secret-with-more-than-32-characters';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';

function loadTs(file, dependencies = {}) {
  if (/^api\/manage\.ts$/.test(file)) {
    dependencies = {
      '../lib/portal-content': require('./test-portal-content.cjs')(dependencies['../lib/portal-http']),
      ...dependencies
    };
  }
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '..', file), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText;
  const localRequire = createRequire(path.join(__dirname, '..', file));
  vm.runInNewContext(code, {
    exports,
    require: name => dependencies[name] || localRequire(name),
    Buffer,
    process,
    console,
    URL,
    Date
  });
  return exports;
}

const auth = loadTs('lib/portal-auth.ts');
const hash = auth.hashPassword('correct-password-for-tests');

function buildUser(role = 'MASTER', overrides = {}) {
  return {
    id: 'member-' + role.toLowerCase(),
    username: 'user_' + role.toLowerCase(),
    name: role === 'MASTER' ? '마스터 운영자' : '원장님',
    role,
    status: 'APPROVED',
    password: hash,
    academyId: 'acad-hq',
    academy: { code: 'HQ', name: '나노의책장 본사', status: 'ACTIVE', deletedAt: null },
    classGroup: { name: '본사반' },
    ...overrides
  };
}

function buildManageHandler(user, extraDb = {}) {
  const db = {
    member: {
      findUnique: async () => user,
      findMany: async () => []
    },
    academy: {
      findUnique: async ({ where }) => {
        if (where.code === 'ACAD-042') {
          return { id: 'acad-42', code: 'ACAD-042', name: '부산 해운대 리딩', status: 'ACTIVE', deletedAt: null };
        }
        return null;
      },
      findMany: async () => [
        { id: 'acad-42', code: 'ACAD-042', name: '부산 해운대 리딩' }
      ]
    },
    portalSetting: {
      findMany: async () => []
    },
    ...extraDb
  };
  const http = loadTs('lib/portal-http.ts', { './prisma': { prisma: db }, './portal-auth': auth });
  const content = loadTs('lib/portal-content.ts', { './prisma': { prisma: db }, './portal-http': http });
  return loadTs('api/manage.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-auth': auth,
    '../lib/portal-http': http,
    '../lib/portal-learning': loadTs('lib/portal-learning.ts'),
    '../lib/portal-content': content
  }).default;
}

function makeManageReq(query, token) {
  return {
    query: { entity: 'portfolios', ...query },
    method: 'GET',
    headers: {
      origin: 'https://test.example',
      host: 'test.example',
      'content-type': 'application/json',
      cookie: 'nano_portal=' + token
    }
  };
}

function makeRes() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(v) { this.data = v; return this; }
  };
}

test('마스터는 전국(ALL) DB 포트폴리오를 조회할 수 있고 학원·학생 메타·통계를 반환하며 삭제된 학원은 제외한다', async () => {
  const masterUser = buildUser('MASTER');
  let capturedWhere = null;
  const run = buildManageHandler(masterUser, {
    portalSetting: {
      findMany: async ({ where }) => {
        capturedWhere = where;
        return [
          {
            key: 'pf_active_1',
            scope: 'portfolio:acad-42',
            revision: 2,
            updatedAt: new Date('2026-11-12T04:00:00.000Z'),
            value: {
              memberId: 'stu-1',
              name: '홍서연',
              title: '[홍서연] 11월 독서 포트폴리오',
              from: '2026-11-01',
              to: '2026-11-12',
              comment: '책의 맥락을 정확히 이해합니다.',
              books: [
                { title: '수호의 하얀 말', pub: '한림출판사', score: 100, date: '2026-11-10', thought: '감동적이었어요.' },
                { title: '오즈의 마법사', pub: '어스본', score: 80, date: '2026-11-05', thought: '협력이 중요해요.' }
              ],
              createdAt: '2026-11-12T03:30:00.000Z'
            }
          },
          {
            key: 'pf_deleted_acad',
            scope: 'portfolio:acad-deleted',
            revision: 1,
            updatedAt: new Date('2026-11-10T01:00:00.000Z'),
            value: { memberId: 'stu-deleted', name: '삭제된학원학생', books: [], createdAt: '2026-11-10T01:00:00.000Z' }
          }
        ];
      }
    },
    member: {
      findUnique: async () => masterUser,
      findMany: async () => [
        { id: 'stu-1', username: 'seoyeon01', name: '홍서연', school: '해운대초', grade: '초등 3학년', classGroup: { name: '해바라기반' } }
      ]
    }
  });

  const res = makeRes();
  await run(makeManageReq({ academy: 'ALL' }, auth.signSession(masterUser.id, hash)), res);
  assert.equal(res.code, 200);
  assert.equal(JSON.stringify(capturedWhere.scope), JSON.stringify({ startsWith: 'portfolio:' }));
  assert.equal(res.data.items.length, 1);
  assert.equal(res.data.items[0].id, 'pf_active_1');
  assert.equal(res.data.items[0].academyId, 'ACAD-042');
  assert.equal(res.data.items[0].academyName, '부산 해운대 리딩');
  assert.equal(res.data.items[0].classGroup, '해바라기반');
  assert.equal(res.data.items[0].bookCount, 2);
  assert.equal(res.data.items[0].quizAvg, '90점');
  assert.equal(res.data.stats.totalIssuedCount, 1);
  assert.equal(res.data.stats.totalBookCount, 2);
  assert.equal(res.data.stats.avgQuizScore, 90);
});

test('마스터 특정 가맹점·검색 필터와 일반 학원 타 가맹점/ALL 차단(403) 검증', async () => {
  const masterUser = buildUser('MASTER');
  let capturedWhere = null;
  const runMaster = buildManageHandler(masterUser, {
    portalSetting: {
      findMany: async ({ where }) => {
        capturedWhere = where;
        return [
          {
            key: 'pf_filter_1',
            scope: 'portfolio:acad-42',
            revision: 1,
            updatedAt: new Date('2026-11-12T03:00:00.000Z'),
            value: { memberId: 'stu-1', name: '홍서연', title: '11월 성장 리포트', books: [{ title: '책1', score: 95 }], createdAt: '2026-11-12T03:00:00.000Z' }
          }
        ];
      }
    },
    member: {
      findUnique: async () => masterUser,
      findMany: async () => [
        { id: 'stu-1', username: 'seoyeon01', name: '홍서연', school: '해운대초', grade: '3학년', classGroup: { name: '해바라기반' } }
      ]
    }
  });

  const resSpecific = makeRes();
  await runMaster(
    makeManageReq({ academy: 'ACAD-042', classGroup: '해바라기반', search: '홍서연', startDate: '2026-11-01', endDate: '2026-11-13' }, auth.signSession(masterUser.id, hash)),
    resSpecific
  );
  assert.equal(resSpecific.code, 200);
  assert.equal(capturedWhere.scope, 'portfolio:acad-42');
  assert.equal(resSpecific.data.items.length, 1);

  for (const role of ['DIRECTOR', 'TEACHER']) {
    const nonMaster = buildUser(role, { id: 'member-' + role });
    const runOther = buildManageHandler(nonMaster);
    const resOther = makeRes();
    await runOther(makeManageReq({ academy: 'ALL' }, auth.signSession(nonMaster.id, hash)), resOther);
    assert.equal(resOther.code, 403);
  }
});

test('마스터 포트폴리오 UI/스크립트에 카톡 버튼·alert가 제거되고 검색형 드롭다운·실DB 연동·상세 모달이 동작한다', async () => {
  const pfJsPath = path.join(__dirname, '..', 'public_html', 'js', 'master', 'master-portfolio.js');
  const htmlPath = path.join(__dirname, '..', 'public_html', 'master_preview.html');
  const pfJs = fs.readFileSync(pfJsPath, 'utf8');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.equal(pfJs.includes('sendMasterPfKakaoDirect'), false);
  assert.doesNotMatch(pfJs, /sendMasterPfKakao|fa-comment|FEE500/);
  assert.equal(pfJs.includes('alert('), false);
  assert.match(html, /id="masterPfAcademyDropdown"/);
  assert.match(html, /id="masterPfAcademySearchInput"/);
  assert.match(html, /id="masterPortfolioReportModal"/);
  assert.equal(html.includes('masterPfKakaoSentRate'), false);

  function makeEl(id) {
    return {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      src: '',
      style: {},
      options: [],
      listeners: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); }
      },
      addEventListener(t, fn) { (this.listeners[t] = this.listeners[t] || []).push(fn); },
      dispatchEvent(ev) { (this.listeners[ev.type] || []).forEach(fn => fn(ev)); },
      setAttribute() {},
      focus() {},
      contains() { return false; },
      querySelectorAll() { return []; }
    };
  }

  const ids = [
    'masterPfAcademyFilter', 'masterPfAcademyDropdown', 'masterPfAcademyTrigger',
    'masterPfAcademyLabel', 'masterPfAcademyMenu', 'masterPfAcademySearchInput',
    'masterPfAcademySearchClear', 'masterPfAcademyOptions', 'masterPfClassFilter',
    'masterPfStartDate', 'masterPfEndDate', 'masterPfSearchInput',
    'masterPfTableBody', 'masterPfTotalCount', 'masterPfPagination',
    'masterPfMonthIssuedCount', 'masterPfMonthIssuedSub', 'masterPfTotalIssuedCount',
    'masterPfTotalIssuedSub', 'masterPfAvgQuizScore', 'masterPfAvgBookSub',
    'masterPortfolioReportModal', 'masterPfModalLoading', 'masterPfModalSubtitle',
    'masterPfModalReportName', 'masterPfModalPeriod', 'masterPfModalAcademy',
    'masterPfModalIssueDate', 'masterPfModalStudent', 'masterPfModalSchool',
    'masterPfModalBookCount', 'masterPfModalQuizAvg', 'masterPfModalBooksCountBadge',
    'masterPfModalInsightsSection', 'masterPfModalInsightsGrid', 'masterPfModalBooksGrid',
    'masterPfModalCommentCard', 'masterPfModalCommentText'
  ];

  const elMap = Object.fromEntries(ids.map(id => [id, makeEl(id)]));
  elMap.masterPfAcademyFilter.value = 'ALL';
  elMap.masterPfClassFilter.value = 'ALL';
  elMap.masterPfClassFilter.options = [{ value: 'ALL' }];

  const apiCalls = [];
  let modalShown = false;

  const sandbox = {
    console,
    Math,
    Date,
    Object,
    Array,
    Number,
    String,
    Boolean,
    JSON,
    Set,
    encodeURIComponent,
    setTimeout,
    clearTimeout,
    document: {
      readyState: 'complete',
      body: makeEl('body'),
      getElementById: id => elMap[id] || null,
      addEventListener: () => {}
    },
    $: sel => ({
      modal(act) {
        if (sel === '#masterPortfolioReportModal' && act === 'show') modalShown = true;
      }
    }),
    MIGRATED_FRANCHISES: [
      { id: 'HQ', name: '나노의책장 본사' },
      { id: 'ACAD-002', name: '서초 에듀클래스' },
      { id: 'ACAD-042', name: '부산 해운대 리딩' }
    ],
    MIGRATED_MEMBERS: [],
    NANO_SERVER_DATA: true,
    NanoPortal: {
      remote: true,
      async api(url) {
        apiCalls.push(url);
        return {
          items: [{
            id: 'pf_real_77',
            academyId: 'ACAD-042',
            academyName: '부산 해운대 리딩',
            studentId: 'seoyeon01',
            studentName: '홍서연',
            school: '해운대초',
            grade: '초등 3학년',
            classGroup: '해바라기반',
            title: '[홍서연] 11월 독서 성장 포트폴리오',
            period: '2026-11-01 ~ 2026-11-12',
            bookCount: 2,
            quizAvgNum: 95,
            quizAvg: '95점',
            issueDate: '2026-11-12 14:20',
            kstDate: '2026-11-12',
            comment: '어휘 이해도가 뛰어나며 근거를 들어 잘 설명합니다.',
            aiInsights: [{ category: '문해력', comment: '핵심 파악이 정확합니다.' }],
            books: [{ title: '수호의 하얀 말', pub: '한림출판사', score: 100, date: '2026-11-10', thought: '감동적이었어요.' }]
          }],
          stats: { totalIssuedCount: 1, monthIssuedCount: 1, totalBookCount: 2, avgBookCount: 2, avgQuizScore: 95 }
        };
      }
    }
  };
  sandbox.window = sandbox;

  vm.runInNewContext(pfJs, sandbox);

  const p1 = sandbox.initMasterPortfolio();
  const p2 = sandbox.filterMasterPortfolioList();
  await Promise.all([p1, p2]);

  assert.equal(apiCalls.length, 1);
  assert.match(apiCalls[0], /^\/api\/manage\?entity=portfolios&academy=ALL/);
  assert.match(elMap.masterPfTableBody.innerHTML, /홍서연/);
  assert.match(elMap.masterPfTableBody.innerHTML, /부산 해운대 리딩/);
  assert.doesNotMatch(elMap.masterPfTableBody.innerHTML, /박지후|김태윤|카톡/);
  assert.equal(elMap.masterPfAvgQuizScore.textContent, '95');

  // 검색형 가맹점 드롭다운 필터링 (API 미호출) -> 선택 시 재조회
  elMap.masterPfAcademySearchInput.value = '해운대';
  elMap.masterPfAcademySearchInput.dispatchEvent({ type: 'input' });
  assert.equal(apiCalls.length, 1);
  assert.match(elMap.masterPfAcademyOptions.innerHTML, /부산 해운대 리딩/);
  assert.doesNotMatch(elMap.masterPfAcademyOptions.innerHTML, /서초 에듀클래스/);

  await sandbox.selectMasterPfAcademyOption('ACAD-042');
  assert.equal(elMap.masterPfAcademyFilter.value, 'ACAD-042');
  assert.equal(apiCalls.length, 2);
  assert.match(apiCalls[1], /academy=ACAD-042/);

  // [상세보기] 모달 바인딩 검증
  await sandbox.openMasterPfDetailModal('seoyeon01', 'pf_real_77');
  assert.equal(modalShown, true);
  assert.equal(apiCalls.length, 3);
  assert.match(apiCalls[2], /id=pf_real_77/);
  assert.equal(elMap.masterPfModalReportName.textContent, '[홍서연] 11월 독서 성장 포트폴리오');
  assert.equal(elMap.masterPfModalCommentText.textContent, '어휘 이해도가 뛰어나며 근거를 들어 잘 설명합니다.');
  assert.match(elMap.masterPfModalBooksGrid.innerHTML, /수호의 하얀 말/);
});
