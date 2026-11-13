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

test('마스터 포트폴리오 UI/스크립트에 카톡 버튼·alert가 제거되고 검색형 드롭다운·실DB 연동·공용 상세 모달이 동작한다', async () => {
  const pfJsPath = path.join(__dirname, '..', 'public_html', 'js', 'master', 'master-portfolio.js');
  const pfRendererPath = path.join(__dirname, '..', 'public_html', 'js', 'portfolio-renderer.js');
  const pfCssPath = path.join(__dirname, '..', 'public_html', 'css', 'portfolio.css');
  const htmlPath = path.join(__dirname, '..', 'public_html', 'master_preview.html');
  const pfJs = fs.readFileSync(pfJsPath, 'utf8');
  const pfRendererJs = fs.readFileSync(pfRendererPath, 'utf8');
  const pfCss = fs.readFileSync(pfCssPath, 'utf8');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.equal(pfJs.includes('sendMasterPfKakaoDirect'), false);
  assert.doesNotMatch(pfJs, /sendMasterPfKakao|fa-comment|FEE500/);
  assert.equal(pfJs.includes('alert('), false);
  assert.equal(pfJs.includes('upload/book/book_default.jpg'), false);
  assert.match(html, /id="masterPfAcademyDropdown"/);
  assert.match(html, /id="masterPfAcademySearchInput"/);
  assert.match(html, /id="masterPortfolioReportModal"/);
  assert.match(html, /id="masterPortfolioViewport"/);
  assert.match(html, /id="portfolioPrintDoc"/);
  assert.match(html, /id="btnMasterPfViewA4"/);
  assert.match(html, /id="btnMasterPfViewMobile"/);
  assert.match(html, /css\/portfolio\.css\?v=20261113_pf_flow/);
  assert.match(html, /js\/portfolio-renderer\.js\?v=20261113_pf_unify/);
  assert.equal(html.includes('masterPfKakaoSentRate'), false);

  // 한 줄 2권 2열 그리드 및 1페이지 자연 흐름(나의 독서 취향 하단 여백 채움) 인쇄 CSS 검증
  assert.match(pfCss, /\.pf-books-grid-row\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  const pfPrintBlock = pfCss.slice(pfCss.indexOf('@media print'));
  assert.match(pfPrintBlock, /\.pf-page1-section\s*\{[^}]*display:\s*block;[^}]*min-height:\s*0;/);
  assert.equal(/\.pf-page1-section[\s\S]*min-height:\s*254mm/.test(pfPrintBlock), false);
  assert.match(pfPrintBlock, /\.pf-page2-section\s*\{[^}]*break-before:\s*auto;/);
  assert.match(pfPrintBlock, /\.pf-detail-header\s*\{[^}]*display:\s*none\s*!important;/);
  assert.match(pfPrintBlock, /\.pf-book-col,\s*#portfolioPrintDoc\s+\.pf-book-row-card[\s\S]*break-inside:\s*avoid;/);

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
        toggle(c, force) {
          const has = this._set.has(c);
          const next = typeof force === 'boolean' ? force : !has;
          if (next) this._set.add(c);
          else this._set.delete(c);
          return next;
        },
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
    'masterPortfolioViewport', 'portfolioPrintDoc', 'btnMasterPfViewA4', 'btnMasterPfViewMobile'
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
    MIGRATED_BOOKS: [
      { bookNo: 'KA5001', title: '수호의 하얀 말', publisher: '한림출판사', subCategory: '소설', tags: '#우정,#성장' },
      { bookNo: 'KB5001', title: '어린이를 위한 세종대왕', publisher: '창비', subCategory: '인물이야기(위인)', tags: '#역사,#리더십' }
    ],
    NANO_SERVER_DATA: true,
    NanoPortal: {
      remote: true,
      async api(url) {
        apiCalls.push(url);
        if (url.includes('academy=ACAD-002')) {
          return {
            items: [],
            stats: { totalIssuedCount: 0, monthIssuedCount: 0, totalBookCount: 0, avgBookCount: 0, avgQuizScore: 0 }
          };
        }
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
            teacher: '김지수',
            title: '[홍서연] 11월 독서 성장 포트폴리오',
            period: '2026-11-01 ~ 2026-11-12',
            bookCount: 2,
            quizAvgNum: 95,
            quizAvg: '95점',
            issueDate: '2026-11-12 14:20',
            kstDate: '2026-11-12',
            comment: '어휘 이해도가 뛰어나며 근거를 들어 잘 설명합니다.',
            aiInsights: [{ category: '문해력', comment: '핵심 파악이 정확합니다.' }],
            books: [
              { title: '수호의 하얀 말', pub: '한림출판사', score: 100, date: '2026-11-10', thought: '감동적이었어요.', category: '소설' },
              { title: '어린이를 위한 세종대왕', pub: '창비', score: 90, date: '2026-11-11', thought: '탐구 정신이 돋보였어요.', category: '인물이야기(위인)' }
            ]
          }],
          stats: { totalIssuedCount: 1, monthIssuedCount: 1, totalBookCount: 2, avgBookCount: 2, avgQuizScore: 95 }
        };
      }
    }
  };
  sandbox.window = sandbox;

  vm.runInNewContext(pfRendererJs, sandbox);
  vm.runInNewContext(pfJs, sandbox);

  const p1 = sandbox.initMasterPortfolio();
  const p2 = sandbox.filterMasterPortfolioList();
  await Promise.all([p1, p2]);

  assert.equal(apiCalls.length, 1);
  assert.match(apiCalls[0], /^\/api\/manage\?entity=portfolios&academy=ALL/);
  assert.equal(elMap.masterPfClassFilter.disabled, true);
  assert.equal(elMap.masterPfClassFilter.value, 'ALL');
  assert.match(elMap.masterPfClassFilter.innerHTML, /가맹점 먼저 선택/);
  assert.match(elMap.masterPfTableBody.innerHTML, /홍서연/);
  assert.match(elMap.masterPfTableBody.innerHTML, /부산 해운대 리딩/);
  assert.doesNotMatch(elMap.masterPfTableBody.innerHTML, /박지후|김태윤|카톡/);
  assert.equal(elMap.masterPfAvgQuizScore.textContent, '95');

  // 검색형 가맹점 드롭다운 필터링·선택 시 클래스 필터만 활성화되고 조회 버튼 클릭 시 재조회 실행
  elMap.masterPfAcademySearchInput.value = '해운대';
  elMap.masterPfAcademySearchInput.dispatchEvent({ type: 'input' });
  assert.equal(apiCalls.length, 1);
  assert.match(elMap.masterPfAcademyOptions.innerHTML, /부산 해운대 리딩/);
  assert.doesNotMatch(elMap.masterPfAcademyOptions.innerHTML, /서초 에듀클래스/);

  await sandbox.selectMasterPfAcademyOption('ACAD-042');
  assert.equal(elMap.masterPfAcademyFilter.value, 'ACAD-042');
  assert.equal(elMap.masterPfClassFilter.disabled, false);
  assert.match(elMap.masterPfClassFilter.innerHTML, /해바라기반/);
  assert.doesNotMatch(elMap.masterPfClassFilter.innerHTML, /소나무반/);
  assert.equal(apiCalls.length, 1);

  await sandbox.filterMasterPortfolioList();
  assert.equal(apiCalls.length, 2);
  assert.match(apiCalls[1], /academy=ACAD-042/);

  // [상세보기] 공용 #portfolioPrintDoc 모달 바인딩 검증 (독서 취향 3분류 + 2열 성장 기록 + 지도교사 총평)
  await sandbox.openMasterPfDetailModal('seoyeon01', 'pf_real_77');
  assert.equal(modalShown, true);
  assert.equal(apiCalls.length, 3);
  assert.match(apiCalls[2], /id=pf_real_77/);
  const renderedDoc = elMap.portfolioPrintDoc.innerHTML;
  assert.match(renderedDoc, /나의 독서 취향/);
  assert.match(renderedDoc, /인물이야기\(위인\)/);
  assert.match(renderedDoc, /비문학\/정보글/);
  assert.match(renderedDoc, /pf-books-grid-row/);
  assert.match(renderedDoc, /수호의 하얀 말/);
  assert.match(renderedDoc, /담당 교사:\s*김지수/);
  assert.match(renderedDoc, /어휘 이해도가 뛰어나며 근거를 들어 잘 설명합니다\./);

  // A4 / 모바일 390px 뷰 전환 검증
  sandbox.setMasterPortfolioViewMode('mobile');
  assert.equal(elMap.masterPortfolioViewport.classList.contains('portfolio-view-mobile'), true);
  assert.equal(elMap.btnMasterPfViewMobile.classList.contains('active'), true);
  sandbox.setMasterPortfolioViewMode('a4');
  assert.equal(elMap.masterPortfolioViewport.classList.contains('portfolio-view-a4'), true);
  assert.equal(elMap.btnMasterPfViewA4.classList.contains('active'), true);

  // 전체 가맹점 복귀 시 클래스 필터 비활성화+ALL 초기화만 수행하고, 빈 가맹점 조회 시 로딩 스피너 없이 빈 상태가 렌더돼야 함
  elMap.masterPfClassFilter.value = '해바라기반';
  elMap.masterPfStartDate.value = '2025-02-03';
  elMap.masterPfEndDate.value = '2025-02-17';
  await sandbox.selectMasterPfAcademyOption('ALL');
  assert.equal(elMap.masterPfClassFilter.disabled, true);
  assert.equal(elMap.masterPfClassFilter.value, 'ALL');
  assert.equal(apiCalls.length, 3);

  await sandbox.selectMasterPfAcademyOption('ACAD-002');
  assert.equal(apiCalls.length, 3);
  await sandbox.filterMasterPortfolioList();
  assert.equal(apiCalls.length, 4);
  assert.match(apiCalls[3], /academy=ACAD-002/);
  assert.match(apiCalls[3], /startDate=2025-02-03/);
  assert.match(apiCalls[3], /endDate=2025-02-17/);
  assert.equal(apiCalls[3].includes('classGroup='), false);
  assert.doesNotMatch(elMap.masterPfTableBody.innerHTML, /불러오는 중/);
  assert.match(elMap.masterPfTableBody.innerHTML, /<td[^>]+colspan/i);
});

test('포트폴리오 단건 조회 시 지도교사(class_meta 포함)·도서 메타·나노시트 코멘트가 DB에서 보강된다', async () => {
  const masterUser = buildUser('MASTER');
  const handler = buildManageHandler(masterUser, {
    member: {
      findUnique: async () => masterUser,
      findMany: async () => [
        {
          id: 'stu-1',
          username: 'seoyeon01',
          name: '홍서연',
          school: '해운대초',
          grade: '초등 3학년',
          teacherName: null,
          classGroupId: 'cls-42',
          classGroup: { id: 'cls-42', name: '해바라기반' }
        }
      ]
    },
    portalSetting: {
      findMany: async () => [
        {
          key: 'pf_enrich_1',
          scope: 'portfolio:acad-42',
          revision: 1,
          updatedAt: new Date('2026-11-12T05:00:00Z'),
          value: {
            memberId: 'stu-1',
            name: '홍서연',
            title: '11월 독서 성장 포트폴리오',
            from: '2026-11-01',
            to: '2026-11-12',
            books: [{ bookId: 'book-k1', title: '수호의 하얀 말', score: 100, date: '2026-11-10' }],
            comment: '독서 태도가 바릅니다.',
            createdAt: '2026-11-12T05:00:00Z'
          }
        }
      ],
      findUnique: async ({ where }) => {
        if (where && where.key === 'class_meta:cls-42') {
          return { key: 'class_meta:cls-42', value: { teacher: '박지현' } };
        }
        return null;
      }
    },
    book: {
      findMany: async () => [
        {
          id: 'book-k1',
          bookNo: 'KA5001',
          title: '수호의 하얀 말',
          subCategory: '소설',
          category: '문학',
          subject: '우정',
          tags: '#우정,#성장',
          publisher: '한림출판사',
          author: '천쉐이',
          coverUrl: 'resources/images/book_default.svg'
        }
      ]
    },
    quizAttempt: {
      findMany: async () => [
        {
          id: 'att-1',
          bookId: 'book-k1',
          answers: {
            thoughtTeacherComment: '등장인물의 마음을 잘 읽어냈습니다.',
            worksheetAiResult: { goodPoints: '핵심 요약이 정확합니다.' }
          }
        }
      ]
    }
  });

  const res = makeRes();
  await handler(makeManageReq({ academy: 'ACAD-042', id: 'pf_enrich_1' }, auth.signSession(masterUser.id, hash)), res);
  assert.equal(res.code, 200);
  assert.equal(res.data.items.length, 1);
  assert.equal(res.data.items[0].teacher, '박지현');
  assert.equal(res.data.items[0].books[0].subCategory, '소설');
  assert.deepEqual([...res.data.items[0].books[0].tags], ['#우정', '#성장']);
  assert.equal(res.data.items[0].books[0].thoughtTeacherComment, '등장인물의 마음을 잘 읽어냈습니다.');
  assert.equal(res.data.items[0].books[0].worksheetAiResult.goodPoints, '핵심 요약이 정확합니다.');
});

test('주요 포털 HTML 페이지가 잘리지 않고 닫힘 태그와 필수 스크립트를 모두 포함한다', () => {
  const pubDir = path.join(__dirname, '..', 'public_html');
  const pages = ['index.html', 'admin_preview.html', 'master_preview.html', 'student_preview.html'];
  for (const name of pages) {
    const html = fs.readFileSync(path.join(pubDir, name), 'utf8');
    assert.equal(html.includes('truncated for diff preview'), false, `${name}에 diff 축약 문자열이 남아 있습니다`);
    assert.match(html, /<\/body>/i, `${name}에 </body> 태그가 누락되었습니다`);
    assert.match(html, /<\/html>/i, `${name}에 </html> 태그가 누락되었습니다`);
  }

  const adminHtml = fs.readFileSync(path.join(pubDir, 'admin_preview.html'), 'utf8');
  const masterHtml = fs.readFileSync(path.join(pubDir, 'master_preview.html'), 'utf8');
  assert.match(adminHtml, /css\/portal-search\.css\?v=20261113_dropdown_fix/);
  assert.match(adminHtml, /css\/portfolio\.css\?v=20261113_pf_flow/);
  assert.match(adminHtml, /js\/portfolio-renderer\.js\?v=20261113_pf_unify/);
  assert.match(adminHtml, /admin_preview\.js\?v=20261113_kakao_log/);
  assert.match(adminHtml, /js\/admin_members\.js\?v=20261113_center/);
  assert.match(adminHtml, /js\/content-sharing\.js\?v=20261113_center/);
  assert.match(adminHtml, /js\/admin_books\.js\?v=20261113_center/);
  assert.match(masterHtml, /css\/portal-search\.css\?v=20261113_dropdown_fix/);
  assert.match(masterHtml, /css\/master_preview\.css\?v=20261113_print_compact/);
  assert.match(masterHtml, /js\/master\/master-portfolio\.js\?v=20261113_query_only/);
  assert.match(masterHtml, /js\/master\/master-franchise\.js\?v=20261113_center/);
  assert.match(masterHtml, /js\/master\/master-ranking\.js\?v=20261113_query_only/);
  assert.match(masterHtml, /<select[^>]+id="masterPfClassFilter"[^>]+disabled/);

  // 마스터/학원 HTML 내 모든 날짜 입력(<input type="date">)에 즉시 필터 onchange가 없고, 검색바 자동조회 핸들러가 제거되었는지 검증
  for (const [label, doc] of [['master_preview.html', masterHtml], ['admin_preview.html', adminHtml]]) {
    const dateInputs = [...doc.matchAll(/<input\b[^>]*type=["']date["'][^>]*>/gi)].map(m => m[0]);
    assert.equal(dateInputs.length >= 4, true, `${label}에 날짜 입력 필드가 4개 이상이어야 합니다`);
    for (const tag of dateInputs) {
      assert.equal(/\bonchange\s*=/i.test(tag), false, `${label} 날짜 입력에 onchange가 남아 있습니다: ${tag}`);
    }
  }
  for (const forbidden of [
    'onchange="executeMasterLearningSearch',
    'onchange="filterMasterPortfolioList',
    'oninput="scheduleMasterPfSearch',
    'onchange="renderRankings()',
    'onchange="filterDispatchList',
    'onkeyup="filterDispatchList',
    'onchange="filterMasterPaymentList',
    'onkeyup="filterMasterPaymentList'
  ]) {
    assert.equal(masterHtml.includes(forbidden), false, `master_preview.html에 자동조회 핸들러가 남아 있습니다: ${forbidden}`);
  }
  for (const forbidden of [
    'onchange="filterStudents()',
    'onchange="filterAcademyBooks',
    'onchange="renderLearningTable()',
    'onchange="filterPortfolioList',
    'oninput="handlePortfolioSearchInput(this); filterPortfolioList',
    'onchange="filterStudentAssignments()',
    'oninput="filterStudentAssignments()',
    'onchange="renderAcademyDispatchTable',
    'oninput="renderAcademyDispatchTable',
    'onchange="renderAdminRankingView()',
    'onchange="filterAcademyPaymentTable()',
    'onchange="filterIndivModalStudents()',
    'oninput="filterIndivModalStudents()',
    'onchange="filterIndivBookCatalog()',
    'oninput="filterIndivBookCatalog()',
    'onchange="filterBatchBookCatalog()',
    'oninput="filterBatchBookCatalog()'
  ]) {
    assert.equal(adminHtml.includes(forbidden), false, `admin_preview.html에 자동조회 핸들러가 남아 있습니다: ${forbidden}`);
  }
  assert.match(masterHtml, /onclick="applyMasterRankDateFilter\(\)"/);
  assert.match(adminHtml, /onclick="applyAdminRankDateFilter\(\)"/);
  assert.match(adminHtml, /onclick="filterStudentAssignments\(\)"/);
  assert.match(adminHtml, /onclick="filterAcademyPaymentTable\(\)"/);
  assert.match(adminHtml, /onclick="filterIndivModalStudents\(\)"/);
  assert.match(adminHtml, /onclick="filterBatchBookCatalog\(\)"/);

  // admin_preview.html이 참조하는 배포용 로컬 JS 파일 존재 여부 및 구문 검증
  const scriptMatches = [...adminHtml.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m => m[1]);
  for (const src of scriptMatches) {
    if (/^(https?:)?\/\//i.test(src) || src.startsWith('migrated_real_data') || src.startsWith('upload/')) continue;
    const relPath = src.split('?')[0];
    const absPath = path.join(pubDir, relPath);
    assert.equal(fs.existsSync(absPath), true, `누락된 스크립트: ${relPath}`);
    new vm.Script(fs.readFileSync(absPath, 'utf8'), { filename: relPath });
  }
});
