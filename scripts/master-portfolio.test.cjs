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
    assert.ok(Buffer.byteLength(html, 'utf8') < 500 * 1024, `${name} 크기가 500KB 이상(${Buffer.byteLength(html, 'utf8')}B)이어서 diff 축약 위험이 있습니다`);
    assert.match(html, /<\/body>/i, `${name}에 </body> 태그가 누락되었습니다`);
    assert.match(html, /<\/html>/i, `${name}에 </html> 태그가 누락되었습니다`);
  }

  const adminHtml = fs.readFileSync(path.join(pubDir, 'admin_preview.html'), 'utf8');
  const masterHtml = fs.readFileSync(path.join(pubDir, 'master_preview.html'), 'utf8');
  const studentHtml = fs.readFileSync(path.join(pubDir, 'student_preview.html'), 'utf8');
  assert.match(adminHtml, /css\/admin_preview\.css\?v=20261123_quiz_ui/);
  assert.match(studentHtml, /css\/student_preview\.css\?v=20261124_rank_ui/);
  assert.match(adminHtml, /css\/portal-search\.css\?v=20261113_dropdown_fix/);
  assert.match(adminHtml, /css\/portfolio\.css\?v=20261113_pf_flow/);
  assert.match(adminHtml, /js\/portfolio-renderer\.js\?v=20261117_pf_footer/);
  assert.match(adminHtml, /admin_preview\.js\?v=20261119_transfer_opt/);
  assert.match(adminHtml, /js\/admin_members\.js\?v=20261123_class_sync/);
  assert.match(adminHtml, /js\/content-sharing\.js\?v=20261113_center/);
  assert.match(adminHtml, /js\/admin_books\.js\?v=20261125_isbn_code/);
  assert.match(adminHtml, /js\/admin_notices\.js\?v=20261123_wm_center/);
  assert.match(adminHtml, /js\/literacy\/literacy-admin\.js\?v=20261123_class/);
  assert.match(masterHtml, /css\/portal-search\.css\?v=20261113_dropdown_fix/);
  assert.match(masterHtml, /css\/master_preview\.css\?v=20261117_quiz_blank/);
  assert.match(masterHtml, /js\/master\/master-portfolio\.js\?v=20261113_query_only/);
  assert.match(masterHtml, /js\/master\/master-franchise\.js\?v=20261117_reg_layout/);
  assert.match(masterHtml, /js\/master\/master-ranking\.js\?v=20261124_server_book_code/);
  assert.match(masterHtml, /js\/master\/master-contents\.js\?v=20261125_isbn_code/);
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
  assert.match(adminHtml, /onclick="filterIndivBookCatalog\(\)"/);
  assert.match(adminHtml, /class="assign-catalog-filter-box mb-3"/);
  assert.match(adminHtml, /id="indivFilterCategory"[^>]*>[\s\S]{0,120}전체 주제 분류/);
  assert.doesNotMatch(adminHtml, /id="indivFilterCategory"[\s\S]{0,260}문학 \/ 소설/);
  assert.doesNotMatch(adminHtml, /id="batchBookFilterCategory"[\s\S]{0,260}문학 \/ 소설/);

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

test('포트폴리오 발급일자는 UTC createdAt 및 오전/오후 문자열을 KST 24시간 형식(YYYY-MM-DD HH:mm)으로 변환한다', async () => {
  const pubDir = path.join(__dirname, '..', 'public_html');
  const student = { id: 'S1', serverId: 's1', name: '박진호', school: '옥천초등학교', grade: '초등 5학년', teacher: '김선생', classGroup: 'A Class' };
  const ctx = vm.createContext({
    location: { protocol: 'https:', hostname: 'test.example', pathname: '/admin_preview.html' },
    document: { readyState: 'loading' },
    addEventListener() {},
    URLSearchParams,
    AbortSignal,
    currentAcademyInfo: { id: 'A' },
    portfolioList: [],
    portfolioDataMap: {},
    studentDataList: [student],
    academyBookList: [],
    fetch: async () => ({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'pf_am',
            revision: 1,
            memberId: 's1',
            name: '박진호',
            from: '2026-08-13',
            to: '2026-11-13',
            title: '11/13 포트폴리오 테스트',
            books: [],
            createdAt: '2026-11-13T00:59:12.345Z'
          },
          {
            id: 'pf_pm',
            revision: 1,
            memberId: 's1',
            name: '박진호',
            from: '2026-08-12',
            to: '2026-11-12',
            title: '오후 2시 포트폴리오',
            books: [],
            createdAt: '2026-11-13T05:00:00.000Z'
          }
        ]
      })
    })
  });
  ctx.window = ctx;
  vm.runInNewContext(fs.readFileSync(path.join(pubDir, 'js/portal-client.js'), 'utf8'), ctx);
  await ctx.NanoPortal.refreshPortfolios();
  assert.equal(ctx.portfolioList[0].issueDate, '2026-11-13 09:59');
  assert.equal(ctx.portfolioDataMap.pf_am.issueDate, '2026-11-13 09:59');
  assert.equal(ctx.portfolioList[1].issueDate, '2026-11-13 14:00');
  assert.equal(ctx.portfolioDataMap.pf_pm.issueDate, '2026-11-13 14:00');

  const adminSrc = fs.readFileSync(path.join(pubDir, 'admin_preview.js'), 'utf8');
  const ast = ts.createSourceFile('admin_preview.js', adminSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const fnNode = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name && n.name.text === 'formatPortfolioIssueDate24');
  assert.ok(fnNode, 'formatPortfolioIssueDate24 함수가 admin_preview.js에 존재해야 합니다');
  const fnCtx = vm.createContext({ console });
  vm.runInContext(fnNode.getText(ast), fnCtx);
  assert.equal(fnCtx.formatPortfolioIssueDate24('2026.11.13 오후 2:00', ''), '2026-11-13 14:00');
  assert.equal(fnCtx.formatPortfolioIssueDate24('', '2026-11-13T05:00:00.000Z'), '2026-11-13 14:00');
  assert.equal(fnCtx.formatPortfolioIssueDate24('2026.11.13 오전 12:30', ''), '2026-11-13 00:30');
});

test('신규 가맹 학원 등록 모달은 좌·우 영역 분할 배치와 비밀번호 예시·조건 표시를 적용한다', () => {
  const modalHtml = fs.readFileSync(path.join(__dirname, '../public_html/modals/master_modals.html'), 'utf8');
  const formStart = modalHtml.indexOf('<form id="academyRegisterForm"');
  const formEnd = modalHtml.indexOf('</form>', formStart);
  const formHtml = modalHtml.slice(formStart, formEnd);

  const rightColStart = formHtml.indexOf('<!-- 우측 영역');
  assert.ok(rightColStart > 0, '좌·우 영역 주석/분할 구조가 필요합니다');
  const leftColHtml = formHtml.slice(0, rightColStart);
  const rightColHtml = formHtml.slice(rightColStart, formHtml.indexOf('<hr', rightColStart));

  // 좌측 배치 순서 검증
  const leftIds = ['regAcademyBrand', 'regAcademyName', 'regDirectorName', 'regDirectorPhone', 'regDirectorId', 'regDirectorPw'];
  leftIds.reduce((prev, id) => {
    const idx = leftColHtml.indexOf(`id="${id}"`);
    assert.ok(idx > prev, `좌측 영역에 ${id}가 순서대로 있어야 합니다`);
    return idx;
  }, -1);

  // 우측 배치 순서 검증
  const rightIds = ['regBizNumber', 'regDirectorEmail', 'regAddress', 'regMemo'];
  rightIds.reduce((prev, id) => {
    const idx = rightColHtml.indexOf(`id="${id}"`);
    assert.ok(idx > prev, `우측 영역에 ${id}가 순서대로 있어야 합니다`);
    return idx;
  }, -1);

  // 비밀번호 라벨·placeholder·기본값 제거·조건 표시 검증
  assert.match(leftColHtml, /<label[^>]*for="regDirectorPw"[^>]*>비밀번호\s*<span/);
  assert.doesNotMatch(leftColHtml, /초기 비밀번호/);
  const pwInputTag = (leftColHtml.match(/<input[^>]*id="regDirectorPw"[^>]*>/) || [''])[0];
  assert.match(pwInputTag, /placeholder="예: nano1234!"/);
  assert.doesNotMatch(pwInputTag, /value="nano1234!"/);
  assert.match(leftColHtml, /id="regDirectorPwConditions"/);

  // validateRegDirectorPassword 실시간 조건 판정 검증
  const franchiseSrc = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-franchise.js'), 'utf8');
  const ast = ts.createSourceFile('master-franchise.js', franchiseSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const fns = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.name && ['getRegDirectorPasswordChecks', 'validateRegDirectorPassword'].includes(n.name.text));
  assert.equal(fns.length, 2);
  const condEl = { innerHTML: '' };
  const classes = new Set();
  const inputEl = { value: '', classList: { add: c => classes.add(c), remove: c => classes.delete(c) } };
  const ctx = vm.createContext({
    document: { getElementById: id => (id === 'regDirectorPw' ? inputEl : id === 'regDirectorPwConditions' ? condEl : null) }
  });
  for (const fn of fns) vm.runInContext(fn.getText(ast), ctx);

  assert.equal(ctx.validateRegDirectorPassword(''), false);
  assert.match(condEl.innerHTML, /8~128자/);
  assert.equal(ctx.validateRegDirectorPassword('short1'), false);
  assert.equal(ctx.validateRegDirectorPassword('onlyletters'), false);
  assert.equal(ctx.validateRegDirectorPassword('12345678'), false);
  assert.equal(ctx.validateRegDirectorPassword('nano 1234'), false);
  assert.equal(ctx.validateRegDirectorPassword('nano1234!'), true);
  assert.equal(classes.has('is-invalid'), false);
});

test('우편번호 검색 서비스는 종료 예정 t1.daumcdn.net 대신 t1.kakaocdn.net을 사용한다', () => {
  const filesToCheck = [
    path.join(__dirname, '../public_html/admin_preview.html'),
    path.join(__dirname, '../public_html/master_preview.html'),
    path.join(__dirname, '../public_html/js/master/master-core.js'),
    path.join(__dirname, '../public_html/js/admin_myinfo.js'),
  ];
  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.doesNotMatch(content, /t1\.daumcdn\.net\/mapjsapi\/bundle\/postcode/, `${path.basename(filePath)}에 구 t1.daumcdn.net 주소가 남아 있습니다`);
  }
  const adminHtml = fs.readFileSync(filesToCheck[0], 'utf8');
  const masterCore = fs.readFileSync(filesToCheck[2], 'utf8');
  const adminMyInfo = fs.readFileSync(filesToCheck[3], 'utf8');
  assert.match(adminHtml, /https:\/\/t1\.kakaocdn\.net\/mapjsapi\/bundle\/postcode\/prod\/postcode\.v2\.js/);
  assert.match(masterCore, /https:\/\/t1\.kakaocdn\.net\/mapjsapi\/bundle\/postcode\/prod\/postcode\.v2\.js/);
  assert.match(masterCore, /kakao\.Postcode[\s\S]*daum\.Postcode/);
  assert.match(adminMyInfo, /kakao\.Postcode[\s\S]*daum\.Postcode/);
});

test('도서 배정 신규 도서 검색바·하단 페이징과 주제 분류 태그 필터가 주제 분류 태그 데이터에 맞춰 동작한다', () => {
  const adminSrc = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.js'), 'utf8');
  const ast = ts.createSourceFile('admin_preview.js', adminSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const targetFns = [
    'normalizeAssignThemeTag',
    'getAssignThemeCatalogList',
    'getAssignBookThemeTag',
    'bookMatchesAssignThemeFilter',
    'populateAssignThemeFilterSelects',
    'renderAssignCatalogPagination',
  ];
  const fnNodes = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.name && targetFns.includes(n.name.text));
  assert.equal(fnNodes.length, targetFns.length);

  const mkSelect = () => {
    const sel = { options: [], value: 'ALL', innerHTML: '', appendChild(opt) { this.options.push(opt); } };
    Object.defineProperty(sel, 'innerHTML', {
      get() { return ''; },
      set(v) { if (v === '') this.options = []; },
    });
    return sel;
  };
  const indivSelect = mkSelect();
  const batchSelect = mkSelect();
  const pagEl = { innerHTML: '' };

  const sampleThemes = [
    { id: 1, title: '인간', tag: '#인간', active: 'Y', bookIds: [] },
    { id: 8, title: '이야기', tag: '#이야기', active: 'Y', bookIds: [] },
    { id: 9, title: '사회', tag: '#사회', active: 'Y', bookIds: ['B2'] },
  ];
  const sampleBooks = [
    { id: 'FA000001', title: '고양이 목욕탕', category: '문학', themeTag: '#이야기', subject: '이야기', tags: ['#이야기', '고양이'] },
    { id: 'B2', title: '함께 사는 세상', category: '일반', tags: ['공동체'] },
  ];

  const ctx = vm.createContext({
    window: { NANO_SERVER_THEMES: sampleThemes },
    localStorage: { getItem: () => null },
    academyBookList: sampleBooks,
    document: {
      getElementById(id) {
        if (id === 'indivFilterCategory') return indivSelect;
        if (id === 'batchBookFilterCategory') return batchSelect;
        if (id === 'indivBookCatalogPagination') return pagEl;
        return null;
      },
      createElement() {
        return { value: '', textContent: '' };
      },
    },
  });

  for (const fn of fnNodes) vm.runInContext(fn.getText(ast), ctx);

  ctx.populateAssignThemeFilterSelects();
  assert.deepEqual(Array.from(indivSelect.options, o => o.value), ['ALL', '#인간', '#이야기', '#사회']);
  assert.deepEqual(Array.from(batchSelect.options, o => o.value), ['ALL', '#인간', '#이야기', '#사회']);

  assert.equal(ctx.getAssignBookThemeTag(sampleBooks[0], sampleThemes), '#이야기');
  assert.equal(ctx.bookMatchesAssignThemeFilter(sampleBooks[0], '#이야기', sampleThemes), true);
  assert.equal(ctx.bookMatchesAssignThemeFilter(sampleBooks[0], '#인간', sampleThemes), false);
  assert.equal(ctx.bookMatchesAssignThemeFilter(sampleBooks[1], '#사회', sampleThemes), true);

  ctx.renderAssignCatalogPagination({
    containerId: 'indivBookCatalogPagination',
    total: 5608,
    page: 1,
    totalPages: 281,
    pageSize: 20,
    goFnName: 'goIndivCatalogPage',
  });
  assert.match(pagEl.innerHTML, /5,608/);
  assert.match(pagEl.innerHTML, /class="acad-page-btn acad-page-btn-sm active"/);
  assert.doesNotMatch(pagEl.innerHTML, /disabled[^>]*style="[^"]*"[^>]*style="/);
});

test('인증 도서 배정 해제와 일괄 삭제가 서버 deleteMany API 및 refreshAssignments까지 완료되어 새로고침 후에도 유지된다', async () => {
  const rootDir = path.resolve(__dirname, '..');
  // 1) 클라이언트: releaseIndivCertifiedBooks & cleanCertifiedStudentAssignments 검증
  const adminSrc = fs.readFileSync(path.join(rootDir, 'public_html/admin_preview.js'), 'utf8');
  const ast = ts.createSourceFile('admin_preview.js', adminSrc, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const fnNames = [
    'isAssignmentBookCertified',
    'deleteServerAssignmentsByIds',
    'getScopedStudentAssignmentsForTeacher',
    'cleanCertifiedStudentAssignments',
    'releaseIndivCertifiedBooks',
  ];
  const fnNodes = ast.statements.filter(n => ts.isFunctionDeclaration(n) && n.name && fnNames.includes(n.name.text));
  assert.equal(fnNodes.length, fnNames.length);

  let serverAssignments = [
    {
      studentId: 'look1',
      studentName: '박진호',
      classGroup: 'A Class',
      books: [
        { id: 'B1', title: '미인증 도서', isCompleted: false, assignmentId: 'asgn-1' },
        { id: 'B2', title: '인증 도서 1', isCompleted: true, assignmentId: 'asgn-2' },
        { id: 'B3', title: '인증 도서 2', certified: true, certDate: '11월 12일', assignmentId: 'asgn-3' },
      ],
    },
    {
      studentId: 'look2',
      studentName: '최유윤',
      classGroup: 'B Class',
      books: [
        { id: 'B4', title: '타반 인증 도서', isCompleted: true, assignmentId: 'asgn-4' },
      ],
    },
  ];
  const cloneAssignments = () => JSON.parse(JSON.stringify(serverAssignments));
  const deleteCalls = [];
  let refreshedCount = 0;
  const toasts = [];
  const ctx = vm.createContext({
    window: { NanoPortal: null },
    NanoPortal: {
      remote: true,
      async deleteAssignments(ids, academyCode) {
        deleteCalls.push({ ids: [...ids], academyCode });
        serverAssignments = serverAssignments.map(s => ({
          ...s,
          books: s.books.filter(b => !ids.includes(b.assignmentId)),
        })).filter(s => s.books.length > 0);
        return { ok: true, deletedCount: ids.length };
      },
      async refreshAssignments() {
        refreshedCount++;
        ctx.studentAssignmentList = cloneAssignments();
      },
    },
    currentAcademyInfo: { id: 'acad-1' },
    currentIndivStudentId: 'look1',
    currentFilteredStudentAssignments: null,
    studentAssignmentList: cloneAssignments(),
    nanoConfirm: async () => true,
    showAcademyToast: msg => toasts.push(msg),
    isCurrentLoggedInTeacher: () => true,
    getTeacherAssignedClasses: () => [{ name: 'A Class' }],
    syncStudentAssignmentsWithLearningLogs: () => {},
  });
  ctx.window.NanoPortal = ctx.NanoPortal;
  for (const fn of fnNodes) vm.runInContext(fn.getText(ast), ctx);

  await ctx.releaseIndivCertifiedBooks();
  assert.equal(deleteCalls.length, 1);
  assert.deepEqual(deleteCalls[0], { ids: ['asgn-2', 'asgn-3'], academyCode: 'acad-1' });
  assert.equal(refreshedCount, 1);
  assert.deepEqual(Array.from(ctx.studentAssignmentList[0].books, b => b.id), ['B1']);

  // 인증 완료 도서가 없을 때 미인증 도서(B1)를 임의로 삭제하지 않아야 합니다.
  await ctx.releaseIndivCertifiedBooks();
  assert.equal(deleteCalls.length, 1);
  assert.match(toasts[toasts.length - 1], /인증 완료된 도서가 없습니다/);

  // 메인 화면 일괄 삭제(cleanCertifiedStudentAssignments)도 담당 학급 범위의 서버 삭제를 호출해야 합니다.
  serverAssignments[0].books.push({ id: 'B5', title: '새 인증 도서', isCompleted: true, assignmentId: 'asgn-5' });
  ctx.studentAssignmentList = cloneAssignments();
  await ctx.cleanCertifiedStudentAssignments();
  assert.equal(deleteCalls.length, 2);
  assert.deepEqual(deleteCalls[1], { ids: ['asgn-5'], academyCode: 'acad-1' });
  assert.equal(refreshedCount, 2);
  assert.equal(serverAssignments.some(s => s.studentId === 'look2'), true);

  // 2) 서버(api/manage.ts): 단일 id 및 일괄 ids 삭제 검증 (NANO / JD 공용 경로)
  let dbAssignments = [
    { id: 'asgn-1', academyId: 'acad-jd' },
    { id: 'asgn-2', academyId: 'acad-jd' },
    { id: 'asgn-3', academyId: 'acad-other' },
  ];
  const records = new Map([['academy_meta:acad-jd', { brand: 'JD' }]]);
  const db = {
    portalSetting: {
      findUnique: async ({ where }) => records.has(where.key) ? { key: where.key, value: records.get(where.key) } : null,
      findMany: async () => [...records].map(([key, value]) => ({ key, value })),
    },
    bookAssignment: {
      async deleteMany({ where }) {
        const ids = where.id && where.id.in ? where.id.in : [where.id];
        const before = dbAssignments.length;
        dbAssignments = dbAssignments.filter(r => !(r.academyId === where.academyId && ids.includes(r.id)));
        return { count: before - dbAssignments.length };
      },
    },
  };
  const cache = new Map();
  function loadTs(file) {
    const abs = path.resolve(rootDir, file);
    if (cache.has(abs)) return cache.get(abs);
    if (abs === path.join(rootDir, 'lib/prisma.ts')) return { prisma: db };
    if (!abs.endsWith('.ts')) return require(abs);
    const exports = {}; cache.set(abs, exports);
    const transpiled = ts.transpileModule(fs.readFileSync(abs, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const localReq = name => {
      if (!name.startsWith('.')) return require(name);
      let target = path.resolve(path.dirname(abs), name);
      if (fs.existsSync(target + '.ts')) target += '.ts';
      else if (fs.existsSync(target + '.js')) target += '.js';
      return loadTs(target);
    };
    vm.runInNewContext(transpiled, { exports, require: localReq, Buffer, process, console, URL, URLSearchParams, Date, setTimeout, clearTimeout, fetch, AbortSignal }, { filename: abs });
    return exports;
  }
  loadTs('lib/portal-http.ts').authenticate = async () => ({
    id: 'teacher-1', username: 't1', role: 'TEACHER', academyId: 'acad-jd',
    academy: { id: 'acad-jd', code: 'JD', status: 'ACTIVE', deletedAt: null }, portalBrand: 'JD',
  });
  const manageHandler = loadTs('api/manage.ts').default;
  const runDelete = async (data) => {
    const res = { code: 200, setHeader() {}, status(c) { this.code = c; return this; }, json(v) { this.data = v; } };
    await manageHandler({
      url: '/api/manage?entity=assignments', method: 'POST', query: { entity: 'assignments' },
      headers: { host: 'jd.nanosbook.co.kr' },
      body: { operation: 'delete', data },
    }, res);
    return res;
  };
  const batchRes = await runDelete({ ids: ['asgn-1', 'asgn-2', 'asgn-3'] });
  assert.equal(batchRes.code, 200);
  assert.equal(batchRes.data.deletedCount, 2);
  // 타 학원(asgn-3) 배정은 삭제되지 않아야 합니다.
  assert.deepEqual(dbAssignments.map(r => r.id), ['asgn-3']);
});

test('선생님 계정 로그인 시 내 정보 관리 모달의 로그인 ID와 상단 프로필이 로그인 계정 기준으로 표시된다', () => {
  const src = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_myinfo.js'), 'utf8');
  const els = new Map();
  const makeEl = id => {
    const el = { id, innerText: '', innerHTML: '', value: '', className: '', style: { cssText: '' } };
    els.set(id, el);
    return el;
  };
  for (const id of [
    'infoDisplayId', 'infoDisplayBizNum', 'infoDisplayAcademyName', 'infoDisplayDirectorName',
    'infoDisplayPlan', 'infoDisplayContractDate', 'infoDisplayExpireDate',
    'bannerDirectorName', 'bannerAcademyName', 'bannerUserRoleBadge',
    'myInfoSlotStatus', 'sidebarSlotStatus',
    'myInfoPhone', 'myInfoEmail', 'myInfoPostcode', 'myInfoAddress', 'myInfoAddressDetail',
    'myInfoCurrentPw', 'myInfoNewPw', 'myInfoNewPwConfirm', 'pwMatchFeedback',
  ]) {
    makeEl(id);
  }

  let authSession = { id: 'lookteacher', role: 'teacher', name: '박진호' };
  const jQueryModalCalls = [];
  const ctx = vm.createContext({
    currentAcademyInfo: { id: 'acad-1', adminId: 'lookadmin', name: '주식회사 루크러닝', director: '이정민 원장', maxStudents: 100 },
    studentDataList: new Array(7).fill({}),
    getCurrentAuthUser: () => authSession,
    isCurrentLoggedInTeacher: () => authSession.role === 'teacher',
    localStorage: { getItem: () => null },
    sessionStorage: { getItem: () => JSON.stringify(authSession) },
    document: { getElementById: id => els.get(id) || null },
    $: () => ({ modal: action => jQueryModalCalls.push(action) }),
  });
  vm.runInContext(src, ctx);

  ctx.openMyInfoModal();
  assert.equal(els.get('infoDisplayId').innerText, 'lookteacher');
  assert.equal(els.get('infoDisplayDirectorName').innerText, '이정민');
  assert.equal(els.get('bannerDirectorName').innerText, '박진호 선생님');
  assert.match(els.get('bannerUserRoleBadge').innerHTML, /선생님/);
  assert.deepEqual(jQueryModalCalls, ['show']);

  authSession = { id: 'lookadmin', role: 'admin', name: '이정민' };
  ctx.openMyInfoModal();
  assert.equal(els.get('infoDisplayId').innerText, 'lookadmin');
  assert.equal(els.get('bannerDirectorName').innerText, '이정민 원장님');
  assert.equal(els.get('bannerUserRoleBadge').innerText, '최고 관리자');
});

test('포트폴리오 선생님의 한마디 저장 버튼 HTML 속성 깨짐이 없고 NanoPortal.savePortfolio로 서버 저장된다', async () => {
  const rendererSrc = fs.readFileSync(path.join(__dirname, '../public_html/js/portfolio-renderer.js'), 'utf8');
  const rendererCtx = vm.createContext({ window: {} });
  vm.runInContext(rendererSrc, rendererCtx);
  const renderer = rendererCtx.window.NanoPortfolioRenderer;

  const html = renderer.buildPortfolioDocumentHtml({
    studentId: 'look1',
    pfId: 'pf-123',
    allowTeacherNoteEdit: true,
    pfData: {
      id: 'pf-123',
      studentId: 'look1',
      memberId: 'mem-1',
      name: '박진호',
      school: '옥천초',
      grade: '초5',
      academyName: '주식회사 루크러닝',
      className: 'A Class',
      teacher: '박진호 선생님',
      issueDate: '2026-11-17 10:00',
      from: '2026-10-01',
      to: '2026-11-17',
      books: [],
      comment: '기존 한마디',
      teacherNote: '기존 한마디',
      commentSource: 'teacher',
    },
    brandLabel: '나노의 책장',
    logoSrc: '',
  });
  assert.match(html, /id="btnPfTeacherNoteSave"[^>]*data-student-id="look1"[^>]*data-pf-id="pf-123"/);
  assert.match(html, /onclick="saveViewingPortfolioTeacherNote\(this\.dataset\.studentId, this\.dataset\.pfId\)"/);
  assert.doesNotMatch(html, /onclick="saveViewingPortfolioTeacherNote\("look1"/);
  assert.ok(html.includes('나노의 책장 인증 지도교사'));
  assert.ok(!html.includes('독서 교육 연구소'));
  assert.ok(!html.includes('공식 발급 인증서'));

  const adminSrc = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.js'), 'utf8');
  assert.ok(adminSrc.includes('나노의 책장 인증 지도교사'));
  assert.ok(!adminSrc.includes('독서 교육 연구소'));
  assert.ok(!adminSrc.includes('공식 발급 인증서'));
  assert.match(adminSrc, /id="btnPfTeacherNoteSave"[^>]*data-student-id="' \+ escapePortfolioText\(studentId\)/);
  assert.doesNotMatch(adminSrc, /onclick="saveViewingPortfolioTeacherNote\(' \+ JSON\.stringify/);

  const startIdx = adminSrc.indexOf('function togglePfTeacherNoteEdit(show)');
  const endIdx = adminSrc.indexOf('function buildGenreDonutSvg(dist)');
  assert.ok(startIdx > 0 && endIdx > startIdx);
  const fnSlice = adminSrc.slice(startIdx, endIdx);

  const displayEl = { textContent: '기존 한마디', innerText: '기존 한마디', style: { display: 'block' } };
  const editWrap = { style: { display: 'none' } };
  const editBtn = { style: { display: 'inline-block' } };
  const inputEl = { value: '', focus() {} };
  const saveBtn = { disabled: false, innerHTML: '<i class="fa-solid fa-check mr-1"></i>저장' };
  const elements = {
    pfTeacherNoteDisplay: displayEl,
    pfTeacherNoteEditWrap: editWrap,
    btnPfTeacherNoteEdit: editBtn,
    pfTeacherNoteInput: inputEl,
    btnPfTeacherNoteSave: saveBtn,
  };
  const savedCalls = [];
  const toasts = [];
  let refreshCalls = 0;
  let shouldFailSave = false;

  const vmCtx = vm.createContext({
    document: { getElementById: id => elements[id] || null },
    alert: msg => toasts.push(`ALERT:${msg}`),
    showAcademyToast: msg => toasts.push(msg),
    currentViewingPortfolioId: 'pf-123',
    currentAcademyInfo: { id: 'acad-look' },
    portfolioList: [{
      id: 'pf-123',
      revision: 3,
      studentId: 'look1',
      memberId: 'mem-1',
      from: '2026-10-01',
      to: '2026-11-17',
      comment: '기존 한마디',
    }],
    portfolioDataMap: {
      'pf-123': { id: 'pf-123', studentId: 'look1', comment: '기존 한마디', teacherNote: '기존 한마디' },
      look1: { id: 'pf-123', studentId: 'look1', comment: '기존 한마디', teacherNote: '기존 한마디' },
    },
    window: {},
    NanoPortal: {
      remote: true,
      async savePortfolio(payload, academyCode) {
        savedCalls.push({ payload, academyCode });
        if (shouldFailSave) throw new Error('저장 오류 테스트');
      },
      async refreshPortfolios() {
        refreshCalls += 1;
        // 새로고침으로 map이 재생성되는 상황을 시뮬레이션
        vmCtx.portfolioList = [{
          id: 'pf-123',
          revision: 4,
          studentId: 'look1',
          memberId: 'mem-1',
          from: '2026-10-01',
          to: '2026-11-17',
          comment: '수정된 선생님의 한마디입니다.',
        }];
        vmCtx.portfolioDataMap = {
          'pf-123': { id: 'pf-123', studentId: 'look1', comment: '수정된 선생님의 한마디입니다.' },
          look1: { id: 'pf-123', studentId: 'look1', comment: '수정된 선생님의 한마디입니다.' },
        };
      },
    },
  });
  vmCtx.window.NanoPortal = vmCtx.NanoPortal;
  vm.runInContext(fnSlice, vmCtx);

  vmCtx.togglePfTeacherNoteEdit(true);
  assert.equal(editWrap.style.display, 'block');
  assert.equal(inputEl.value, '기존 한마디');

  inputEl.value = '수정된 선생님의 한마디입니다.';
  await vmCtx.saveViewingPortfolioTeacherNote('look1', 'pf-123');

  assert.equal(savedCalls.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(savedCalls[0])), {
    academyCode: 'acad-look',
    payload: {
      id: 'pf-123',
      revision: 3,
      memberId: 'mem-1',
      from: '2026-10-01',
      to: '2026-11-17',
      comment: '수정된 선생님의 한마디입니다.',
    },
  });
  assert.equal(refreshCalls, 1);
  assert.equal(vmCtx.portfolioDataMap['pf-123']._aiRequested, true);
  assert.equal(vmCtx.portfolioDataMap['pf-123'].teacherNote, '수정된 선생님의 한마디입니다.');
  assert.equal(displayEl.textContent, '수정된 선생님의 한마디입니다.');
  assert.equal(editWrap.style.display, 'none');
  assert.equal(saveBtn.disabled, false);

  // 저장 실패 시 수정창을 닫지 않고 오류 토스트를 표시하며 버튼을 복구해야 합니다.
  vmCtx.togglePfTeacherNoteEdit(true);
  inputEl.value = '실패할 한마디';
  shouldFailSave = true;
  await vmCtx.saveViewingPortfolioTeacherNote('look1', 'pf-123');
  assert.equal(editWrap.style.display, 'block');
  assert.equal(saveBtn.disabled, false);
  assert.match(toasts[toasts.length - 1], /저장하지 못했습니다/);
});

test('모든 콘텐츠 관리 메뉴(본사·학원)에서 북퀴즈 현황 컬럼은 문항 수 대신 등록된 퀴즈 세트 수를 표시한다', async () => {
  const adminHtml = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.html'), 'utf8');
  const masterHtml = fs.readFileSync(path.join(__dirname, '../public_html/master_preview.html'), 'utf8');
  assert.match(adminHtml, /<th[^>]*>북퀴즈 현황<\/th>/);
  assert.match(masterHtml, /<th[^>]*>북퀴즈 현황<\/th>/);
  assert.doesNotMatch(masterHtml, /<th[^>]*>퀴즈 등록 여부<\/th>/);

  // 1) 학원 콘텐츠 관리(admin_books.js) 검증
  const adminBooksSrc = fs.readFileSync(path.join(__dirname, '../public_html/js/admin_books.js'), 'utf8');
  const extractBlock = (src, startMarker, endMarker) => {
    const start = src.indexOf(startMarker);
    const end = src.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, `${startMarker} ~ ${endMarker} 블록 추출 실패`);
    return src.slice(start, end);
  };

  const adminSlice = extractBlock(
    adminBooksSrc,
    'function countValidAcadQuizSets(sets)',
    'var academyBookList = (function()'
  );
  const adminRenderSlice = extractBlock(
    adminBooksSrc,
    'function renderAcademyBookTable(data, totalCount, startIdx)',
    '// 학원 도서 페이지네이션 UI 렌더링'
  );
  const renderedRows = [];
  const adminTbody = {
    innerHTML: '',
    appendChild(tr) { renderedRows.push(tr); },
  };
  const adminCtx = vm.createContext({
    DEFAULT_BOOK_COVER: 'cover.svg',
    normalizeBookCoverUrl: u => u || 'cover.svg',
    checkBookHasAvailableSheet: b => !!b.hasSheet,
    isBookCreatedByMyAcademy: () => false,
    academyBookList: [],
    lastAddedBookId: null,
    window: { NANO_SERVER_DATA: true, MIGRATED_QUIZZES: {}, MIGRATED_BOOKS: [] },
    document: {
      getElementById: id => (id === 'academyBookTableBody' ? adminTbody : null),
      createElement: () => ({ className: '', innerHTML: '' }),
    },
  });
  adminCtx.window.MIGRATED_BOOKS = [];
  vm.runInContext(adminSlice + '\n' + adminRenderSlice, adminCtx);

  const serverBooks = [
    adminCtx.createAcademyBookItem({ id: 'B0', title: '미출제 도서', author: '저자0', publisher: '출판0', quizSetCount: 0, hasQuiz: false, quizCount: 0 }),
    adminCtx.createAcademyBookItem({ id: 'B1', title: '고양이 목욕탕', author: '저자1', publisher: '출판1', quizSetCount: 1, hasQuiz: true, quizCount: 5 }),
    adminCtx.createAcademyBookItem({ id: 'B2', title: '어린 왕자', author: '저자2', publisher: '출판2', quizSetCount: 2, hasQuiz: true, quizCount: 8 }),
  ];
  assert.equal(serverBooks[0].quizSetCount, 0);
  assert.equal(serverBooks[0].quizStatus, '미등록');
  assert.equal(serverBooks[1].quizSetCount, 1);
  assert.equal(serverBooks[1].quizStatus, '1세트 등록');
  assert.equal(serverBooks[2].quizSetCount, 2);
  assert.equal(serverBooks[2].quizStatus, '2세트 등록');

  adminCtx.academyBookList = serverBooks;
  adminCtx.renderAcademyBookTable(serverBooks, 3, 0);
  assert.equal(renderedRows.length, 3);
  assert.match(renderedRows[0].innerHTML, />미등록</);
  assert.match(renderedRows[1].innerHTML, />1세트 등록</);
  assert.match(renderedRows[2].innerHTML, />2세트 등록</);
  for (const row of renderedRows) {
    assert.doesNotMatch(row.innerHTML, /문항 완비/);
  }

  // 모달/엑셀 저장 후 세트 수 실시간 동기화 확인 (0세트 -> 2세트)
  adminCtx.syncAcademyBookQuizMeta(serverBooks[0], [
    { id: 's1', questions: [{ question: 'q1' }] },
    { id: 's2', questions: [{ question: 'q2' }] },
  ], { loadedFromServer: true });
  renderedRows.length = 0;
  adminCtx.renderAcademyBookTable(serverBooks, 3, 0);
  assert.match(renderedRows[0].innerHTML, />2세트 등록</);

  // 2) 마스터 콘텐츠 관리(master-contents.js) 검증
  const masterSrc = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8');
  assert.doesNotMatch(masterSrc, />1Set</);
  assert.doesNotMatch(masterSrc, />No</);
  const masterSlice = extractBlock(
    masterSrc,
    'function countValidMasterQuizSets(sets)',
    'function renderMasterContents()'
  );
  const masterCtx = vm.createContext({ window: { NANO_SERVER_DATA: true } });
  vm.runInContext(masterSlice, masterCtx);

  assert.equal(masterCtx.getBookQuizSetCount({ id: 'FA000001', title: '고양이 목욕탕', quizSetCount: 0, quizSets: [] }), 0);
  assert.equal(masterCtx.getBookQuizSetCount({ id: 'B1', quizSetCount: 1, quizSets: [] }), 1);
  assert.equal(masterCtx.getBookQuizSetCount({ id: 'B2', quizSetCount: 2, quizSets: [] }), 2);
  assert.equal(masterCtx.getBookQuizSetCount({
    id: 'B3',
    quizSetCount: 1,
    _quizLoadedFromServer: true,
    quizSets: [{ questions: [{ q: 1 }] }, { questions: [{ q: 2 }] }, { questions: [] }],
  }), 2);
  assert.match(masterCtx.buildMasterQuizSetBadgeHtml(0), />미등록</);
  assert.match(masterCtx.buildMasterQuizSetBadgeHtml(1), />1세트 등록</);
  assert.match(masterCtx.buildMasterQuizSetBadgeHtml(3), />3세트 등록</);

  // 3) api/bootstrap.ts null/0 seq 통합 및 api/manage.ts bulk_import 세트 수 반환 검증
  const bootstrapSrc = fs.readFileSync(path.join(__dirname, '../api/bootstrap.ts'), 'utf8');
  assert.match(bootstrapSrc, /const seq = group\.legacyQuizSeq \|\| 0;/);
  assert.match(bootstrapSrc, /if \(!seqSet\.has\(seq\)\)/);
  const manageSrc = fs.readFileSync(path.join(__dirname, '../api/manage.ts'), 'utf8');
  assert.match(manageSrc, /bookQuizSetCounts/);
});

test('학생 페이지는 북퀴즈 미등록 또는 타 가맹점 비공개 퀴즈만 있는 도서를 노출하지 않고 생각 담기 문구를 사용한다', async () => {
  const rootDir = path.join(__dirname, '..');
  const date = new Date('2026-11-17T00:00:00Z');
  const hash = '$2a$10$abcdefghijklmnopqrstuvwxyz123456';
  const academies = [
    { id: 'acad-a', code: 'ACADA', name: 'A가맹점', status: 'ACTIVE', deletedAt: null, joinDate: date, startDate: date, endDate: date, kakaoBalance: 0, maxStudents: 50, monthlyFee: 0, plan: 'BASIC', bizNo: '', directorName: '원장A', phone: '010', email: '', address: '', memo: '', _count: { members: 1 } },
    { id: 'acad-b', code: 'ACADB', name: 'B가맹점', status: 'ACTIVE', deletedAt: null, joinDate: date, startDate: date, endDate: date, kakaoBalance: 0, maxStudents: 50, monthlyFee: 0, plan: 'BASIC', bizNo: '', directorName: '원장B', phone: '010', email: '', address: '', memo: '', _count: { members: 1 } },
    { id: 'acad-c', code: 'ACADC', name: 'C가맹점', status: 'ACTIVE', deletedAt: null, joinDate: date, startDate: date, endDate: date, kakaoBalance: 0, maxStudents: 50, monthlyFee: 0, plan: 'BASIC', bizNo: '', directorName: '원장C', phone: '010', email: '', address: '', memo: '', _count: { members: 1 } },
  ];
  const membersMap = {
    'std-a': { id: 'std-a', username: 'stda', name: '학생A', role: 'STUDENT', status: 'APPROVED', academyId: 'acad-a', academy: academies[0], password: hash, grade: '초3', createdAt: date, updatedAt: date, points: 0, bookCount: 0, quizAvg: 0 },
    'std-b': { id: 'std-b', username: 'stdb', name: '학생B', role: 'STUDENT', status: 'APPROVED', academyId: 'acad-b', academy: academies[1], password: hash, grade: '초3', createdAt: date, updatedAt: date, points: 0, bookCount: 0, quizAvg: 0 },
    'std-c': { id: 'std-c', username: 'stdc', name: '학생C', role: 'STUDENT', status: 'APPROVED', academyId: 'acad-c', academy: academies[2], password: hash, grade: '초3', createdAt: date, updatedAt: date, points: 0, bookCount: 0, quizAvg: 0 },
    'dir-b': { id: 'dir-b', username: 'dirb', name: '원장B', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-b', academy: academies[1], password: hash, createdAt: date, updatedAt: date, points: 0, bookCount: 0, quizAvg: 0 },
  };
  let currentMember = membersMap['std-a'];
  const settingRows = [
    { key: 'content_quiz:book-priv-a:-101', scope: 'content_quiz', revision: 1, value: { bookId: 'book-priv-a', seq: -101, ownerAcademyId: 'acad-a', ownerMemberId: 'dir-a', academyName: 'A가맹점', authorType: 'ACADEMY', isPublic: 'N' } },
    { key: 'quiz_seq:-101', scope: 'quiz_author_seq', revision: 1, value: { academyId: 'acad-a', academyCode: 'ACADA', academyName: 'A가맹점', authorName: 'A가맹점', authorType: 'ACADEMY' } },
    { key: 'content_folder:f1', scope: 'content_folder', revision: 1, value: { id: 'f1', ownerAcademyId: 'acad-a', ownerMemberId: 'dir-a', bookIds: ['book-priv-a'], recipients: [{ academyId: 'acad-c', academyName: 'C가맹점' }] } },
  ];
  const db = {
    member: {
      findUnique: async ({ where }) => membersMap[where.id] || currentMember,
      findMany: async () => [currentMember],
    },
    academy: { findMany: async ({ where }) => (where?.id ? academies.filter(a => a.id === where.id) : academies) },
    book: {
      findMany: async () => [
        { id: 'book-pub', bookNo: 'BPUB0001', title: '공개퀴즈도서', grade: '초3', createdAt: date, isRecommended: false, _count: { quizAttempts: 0 } },
        { id: 'book-noquiz', bookNo: 'BNOQ0001', title: '퀴즈미등록도서', grade: '초3', createdAt: date, isRecommended: false, _count: { quizAttempts: 0 } },
        { id: 'book-priv-a', bookNo: 'BPRV0001', title: 'A비공개퀴즈도서', grade: '초3', createdAt: date, isRecommended: false, _count: { quizAttempts: 0 } },
      ],
    },
    bookQuiz: {
      groupBy: async () => [
        { bookId: 'book-pub', legacyQuizSeq: 0, _count: { id: 5 } },
        { bookId: 'book-priv-a', legacyQuizSeq: -101, _count: { id: 5 } },
      ],
    },
    portalSetting: {
      findUnique: async () => null,
      findMany: async ({ where }) => {
        if (where?.scope === 'content_folder') return settingRows.filter(r => r.scope === 'content_folder');
        if (where?.scope?.in) return settingRows.filter(r => where.scope.in.includes(r.scope));
        return [];
      },
    },
    quizAttempt: { groupBy: async () => [] },
    classGroup: { findMany: async () => [] },
    mainBanner: { findMany: async () => [] },
    themeCategory: { findMany: async () => [] },
    notice: { findMany: async () => [] },
    academyBook: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    aligoDispatchLog: { findMany: async () => [] },
  };
  const cache = new Map();
  function loadTs(file) {
    const abs = path.resolve(rootDir, file);
    if (cache.has(abs)) return cache.get(abs);
    if (abs === path.join(rootDir, 'lib/prisma.ts')) return { prisma: db };
    if (!abs.endsWith('.ts')) return require(abs);
    const exports = {}; cache.set(abs, exports);
    const transpiled = ts.transpileModule(fs.readFileSync(abs, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const localReq = name => {
      if (!name.startsWith('.')) return require(name);
      let target = path.resolve(path.dirname(abs), name);
      if (fs.existsSync(target + '.ts')) target += '.ts';
      else if (fs.existsSync(target + '.js')) target += '.js';
      return loadTs(target);
    };
    vm.runInNewContext(transpiled, { exports, require: localReq, Buffer, process, console, URL, URLSearchParams, Date, setTimeout, clearTimeout, fetch, AbortSignal }, { filename: abs });
    return exports;
  }

  const portalAuth = loadTs('lib/portal-auth.ts');
  const bootstrapHandler = loadTs('api/bootstrap.ts').default;
  const runBootstrap = async (memberKey) => {
    currentMember = membersMap[memberKey];
    const token = portalAuth.signSession(currentMember.id, hash);
    const res = {
      code: 200, headers: {}, data: '',
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.code = c; return this; },
      send(v) { this.data = v; return this; },
    };
    await bootstrapHandler({ method: 'GET', url: '/api/bootstrap', headers: { cookie: 'nano_portal=' + token, host: 'nanosbook.co.kr' } }, res);
    assert.equal(res.code, 200);
    const ctx = { window: {}, sessionStorage: { setItem() {} } };
    vm.runInNewContext(res.data, ctx);
    return Array.from(ctx.window.MIGRATED_BOOKS, b => String(b.id));
  };

  // A가맹점 학생: 공개 + 자기 학원 비공개 퀴즈 도서 노출, 퀴즈 미등록 도서 제외
  assert.deepEqual(await runBootstrap('std-a'), ['BPUB0001', 'BPRV0001']);
  // B가맹점 학생: 공개 퀴즈 도서만 노출 (미등록·타 가맹점 비공개 모두 제외)
  assert.deepEqual(await runBootstrap('std-b'), ['BPUB0001']);
  // C가맹점 학생(공유폴더 수신): 공개 + 공유받은 비공개 퀴즈 도서 노출
  assert.deepEqual(await runBootstrap('std-c'), ['BPUB0001', 'BPRV0001']);
  // 가맹점 관리자(원장): 퀴즈 미등록 도서도 콘텐츠 관리에서 퀴즈 출제 가능하도록 유지
  assert.deepEqual(await runBootstrap('dir-b'), ['BPUB0001', 'BNOQ0001', 'BPRV0001']);

  // 클라이언트(student_preview.html) 필터 및 생각 담기 문구 검증
  const studentHtml = fs.readFileSync(path.join(rootDir, 'public_html/student_preview.html'), 'utf8');
  assert.ok(studentHtml.includes('>생각 담기 (마지막 주관식 과제)<'));
  assert.ok(studentHtml.includes('<h3>생각 담기</h3>'));
  assert.equal(studentHtml.includes('나노 시트 생각 담기'), false);
  assert.equal(studentHtml.includes('나노 시트 · 나의 생각 담기'), false);
  assert.match(studentHtml, /libData\s*=\s*libData\.filter\(isBookQuizReady\)/);

  const reportJs = fs.readFileSync(path.join(rootDir, 'public_html/js/learning-report-public.js'), 'utf8');
  assert.ok(reportJs.includes('<h2>생각 담기</h2>'));
  assert.equal(reportJs.includes('나노시트 생각 담기'), false);

  const readyFnStart = studentHtml.indexOf('function isQuizSetAccessibleForStudent(s, identity)');
  const readyFnEnd = studentHtml.indexOf('function getBookQuizActionBtnHtml(b, extraStyle)');
  assert.ok(readyFnStart > 0 && readyFnEnd > readyFnStart);
  let studentIdentity = { academyId: 'ACAD-B', academyName: 'B가맹점' };
  const sCtx = vm.createContext({
    window: {},
    getStudentQuizIdentity: () => studentIdentity,
  });
  vm.runInContext(studentHtml.slice(readyFnStart, readyFnEnd), sCtx);

  const privBookA = { id: 'P1', quizSets: [{ isPublic: 'N', academyId: 'ACAD-A', questions: [{ q: 'q1' }] }] };
  const noQuizBook = { id: 'N1', hasQuiz: false, quizCount: 0, quizSets: [] };
  assert.equal(sCtx.isBookQuizReady(noQuizBook), false);
  assert.equal(sCtx.isBookQuizReady(privBookA), false);
  studentIdentity = { academyId: 'ACAD-A', academyName: 'A가맹점' };
  assert.equal(sCtx.isBookQuizReady(privBookA), true);
});

test('[전체] 북퀴즈 등록 시 1번·추가 2번 문항 및 새 세트가 하드코딩 예시 없이 빈 입력과 클릭 시 사라지는 placeholder만 표시된다', async () => {
  const rootDir = path.join(__dirname, '..');
  const extractBlock = (src, startMarker, endMarker) => {
    const start = src.indexOf(startMarker);
    const end = src.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, `${startMarker} ~ ${endMarker} 블록 추출 실패`);
    return src.slice(start, end);
  };

  // 1) HTML / CSS 예시 placeholder 및 :focus::placeholder 투명화 + 대상도서 고정표시·간략 읽기전용·공개설정 필 UI 검증 (학원·본사)
  const adminHtml = fs.readFileSync(path.join(rootDir, 'public_html/admin_preview.html'), 'utf8');
  const adminCss = fs.readFileSync(path.join(rootDir, 'public_html/css/admin_preview.css'), 'utf8');
  const masterModalsHtml = fs.readFileSync(path.join(rootDir, 'public_html/modals/master_modals.html'), 'utf8');
  const masterCss = fs.readFileSync(path.join(rootDir, 'public_html/css/master_preview.css'), 'utf8');

  assert.match(adminHtml, /id="abQuizQuestion"[^>]*placeholder="예:/);
  assert.match(adminHtml, /id="abOpt1"[^>]*placeholder="예:/);
  assert.doesNotMatch(adminHtml, /<select[^>]+id="aqTargetBookSelect"/);
  assert.match(adminHtml, /id="aqTargetBookTitle"/);
  assert.match(adminHtml, /id="abQuizReadOnlyNotice"[^>]*padding:\s*7px 14px/);
  assert.match(adminHtml, /class="ab-pub-pill ab-pub-pill-public"/);
  assert.match(adminHtml, /class="ab-pub-pill ab-pub-pill-private"/);
  assert.match(adminCss, /#academyQuizManageModal\s+input:focus::placeholder,\s*#academyQuizManageModal\s+textarea:focus::placeholder\s*\{\s*color:\s*transparent;\s*\}/);
  assert.match(adminCss, /#academyQuizManageModal\s+\.ab-pub-pill/);
  assert.match(masterModalsHtml, /id="mqQuestionText"[^>]*placeholder="예:/);
  assert.match(masterCss, /#masterQuizModal\s+input:focus::placeholder,\s*#masterQuizModal\s+textarea:focus::placeholder\s*\{\s*color:\s*transparent;\s*\}/);

  const makeMockEl = (id, tracker) => ({
    id,
    value: '',
    checked: false,
    disabled: false,
    innerHTML: '',
    textContent: '',
    innerText: '',
    style: {},
    dataset: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; },
    },
    focus() {
      if (tracker) tracker.focusedIds.push(id);
    },
  });

  // 2) 학원 관리자(admin_books.js): 빈 초기 1번 문항, 본사 세트에서 '+ 새 북퀴즈 추가', 1번->2번 '+ 문항 추가' 시 DOM 누수 방지 검증
  const abSrc = fs.readFileSync(path.join(rootDir, 'public_html/js/admin_books.js'), 'utf8');
  const abBlankSlice = extractBlock(
    abSrc,
    'var editingAcadBookId = null;',
    '// ==============================================================\r\n// 6-A.'
  ).replace(/if\s*\(typeof pdfjsLib\s*!==\s*'undefined'\)\s*\{[\s\S]*?\}/, '');
  const abQuizModalSlice = extractBlock(
    abSrc,
    'var curQuizTargetBookId = null;',
    'async function handleSaveAcademyQuizOnly(event)'
  );

  const abTracker = { focusedIds: [] };
  const abEls = {};
  const getAbEl = (id) => {
    if (!abEls[id]) abEls[id] = makeMockEl(id, abTracker);
    return abEls[id];
  };
  getAbEl('abQuizOptionCountSelect').value = '4';
  const abCtx = vm.createContext({
    DEFAULT_BOOK_COVER: 'cover.svg',
    normalizeBookCoverUrl: u => u || 'cover.svg',
    showAcademyToast() {},
    currentAcademyInfo: { id: 'acad-look', name: '주식회사 루크러닝' },
    academyBookList: [
      {
        id: 'B-EMPTY',
        title: '신규 등록 도서',
        grade: '초4',
        author: '저자',
        coverUrl: 'c.png',
        quizList: [],
        quizSets: [],
      },
      {
        id: 'B-MK',
        title: '그래서 학원 마케팅',
        grade: '중3',
        author: '윤진옥',
        coverUrl: 'c2.png',
        quizSets: [
          {
            id: 'qs_hq_mk',
            authorType: 'HQ',
            authorName: '본사',
            academyName: '본사 직속(HQ)',
            isMine: false,
            isPublic: 'Y',
            questions: [
              {
                question: '[그래서 학원 마케팅] 1. 도서의 중심 인물과 배경에 대한 올바른 설명은 무엇인가요?',
                type: 'CHOICE',
                optionCount: 4,
                opt1: '주인공이 겪는 핵심 갈등의 배경과 정확히 일치한다',
                opt2: '전혀 다른 시대적 배경에서 펼쳐진다',
                opt3: '주인공이 등장하지 않는 허구의 서술이다',
                opt4: '결말과 정반대되는 인물 관계이다',
                ans: '1',
                hint: '힌트',
              },
            ],
          },
        ],
      },
    ],
    window: { NANO_SERVER_DATA: false, MIGRATED_QUIZZES: {}, NanoPortal: null },
    document: {
      getElementById: getAbEl,
      querySelector(sel) {
        if (sel === 'input[name="abQuizType"]:checked') {
          return { value: getAbEl('abQuizTypeSubjective').checked ? 'SUBJECTIVE' : 'CHOICE' };
        }
        if (sel === 'input[name="abQuizAns"]:checked') {
          for (let k = 1; k <= 5; k++) {
            if (getAbEl(`abQuizAns${k}`).checked) return getAbEl(`abQuizAns${k}`);
          }
          return getAbEl('abQuizAns1');
        }
        return null;
      },
      querySelectorAll() { return []; },
    },
    $: () => {
      const jq = {
        modal() { return jq; },
        val() { return jq; },
        prop() { return jq; },
        focus() { return jq; },
        remove() { return jq; },
        show() { return jq; },
        hide() { return jq; },
        on() { return jq; },
        off() { return jq; },
        addClass() { return jq; },
        removeClass() { return jq; },
        appendTo() { return jq; },
      };
      return jq;
    },
  });
  vm.runInContext(abBlankSlice + '\n' + abQuizModalSlice, abCtx);

  const blankSets = abCtx.ensureAcadBookQuizSets(abCtx.academyBookList[0]);
  assert.equal(blankSets[0].questions[0].question, '');
  assert.equal(blankSets[0].questions[0].opt1, '');
  assert.equal(blankSets[0].questions[0].opt2, '');
  assert.equal(blankSets[0].questions[0].opt3, '');

  // 본사 기존 퀴즈가 있는 도서를 연 뒤 '+ 새 북퀴즈 추가' 클릭 -> HQ 1번 문항 텍스트가 새 세트에 복사되지 않아야 함
  await abCtx.openAcademyStandaloneQuizModal('B-MK');
  assert.match(getAbEl('abQuizQuestion').value, /중심 인물과 배경/);
  abCtx.addNewAcadQuizSet();
  assert.equal(getAbEl('abQuizQuestion').value, '');
  assert.equal(getAbEl('abOpt1').value, '');
  assert.equal(getAbEl('abOpt2').value, '');
  assert.equal(getAbEl('abOpt3').value, '');
  assert.equal(getAbEl('abOpt4').value, '');

  // 우리 학원 1번 문항 작성 후 '+ 문항 추가' 클릭 -> 2번 문항은 비어있고 placeholder만 노출(자동 focus로 가리지 않음)
  getAbEl('abQuizQuestion').value = '내가 작성한 1번 문항';
  getAbEl('abOpt1').value = '보기 1';
  getAbEl('abOpt2').value = '보기 2';
  getAbEl('abOpt3').value = '보기 3';
  abCtx.saveCurrentAcadQuizInput();
  abTracker.focusedIds.length = 0;
  abCtx.addAcadQuizItem();
  assert.equal(abCtx.editingAcadQuizzes.length, 2);
  assert.equal(abCtx.editingAcadQuizzes[0].question, '내가 작성한 1번 문항');
  assert.equal(getAbEl('abQuizQuestion').value, '');
  assert.equal(getAbEl('abOpt1').value, '');
  assert.equal(getAbEl('abOpt2').value, '');
  assert.equal(getAbEl('abOpt3').value, '');
  assert.equal(abTracker.focusedIds.includes('abQuizQuestion'), false);

  // 3) 본사 관리자(master-contents.js): 하드코딩 문항 제거 및 1번->2번 추가 시 빈 문항 검증
  const mcSrc = fs.readFileSync(path.join(rootDir, 'public_html/js/master/master-contents.js'), 'utf8');
  const mcSlice = extractBlock(mcSrc, 'let curQuizTargetBookId = null;', 'function validateMasterQuizQuestions(')
    .replace(/^let (curQuiz\w+|currentQuizQuestions)\b/gm, 'var $1');
  const mcTracker = { focusedIds: [] };
  const mcEls = {};
  const getMcEl = (id) => {
    if (!mcEls[id]) mcEls[id] = makeMockEl(id, mcTracker);
    return mcEls[id];
  };
  let renderedChoiceInputs = [];
  const containerEl = makeMockEl('mqDynamicChoicesContainer', mcTracker);
  Object.defineProperty(containerEl, 'innerHTML', {
    get() { return this._html || ''; },
    set(val) {
      this._html = String(val || '');
      renderedChoiceInputs = [];
      const matches = [...this._html.matchAll(/id="(mqOpt\d+)"[^>]*value="([^"]*)"/g)];
      for (const m of matches) {
        const el = getMcEl(m[1]);
        el.value = m[2];
        renderedChoiceInputs.push(el);
      }
    },
  });
  mcEls.mqDynamicChoicesContainer = containerEl;

  const mcCtx = vm.createContext({
    showMasterToast() {},
    renderQuizTabButtons() {},
    updateQuizMediaUI() {},
    switchMasterQuizSet() {},
    masterBooks: [
      { id: 'MB-EMPTY', title: '미출제 도서', grade: '초3', author: '작가', coverUrl: 'c.png', quizList: [], quizSets: [] },
      { id: 'MB-LP', title: '어린 왕자', grade: '초5', author: '생텍쥐페리', coverUrl: 'c.png', quizList: [], quizSets: [] },
    ],
    window: { NANO_SERVER_DATA: true, MIGRATED_QUIZZES: {}, NanoPortal: { remote: true } },
    document: {
      getElementById: getMcEl,
      querySelector(sel) {
        if (sel === 'input[name="mqQuestionType"]:checked') {
          return { value: getMcEl('mqTypeSubjective').checked ? 'SUBJECTIVE' : 'CHOICE' };
        }
        if (sel === 'input[name="mqChoiceCorrect"]:checked') {
          return { value: '1' };
        }
        return null;
      },
      querySelectorAll(sel) {
        if (sel === '.choice-opt-input') return renderedChoiceInputs;
        return [];
      },
    },
  });
  vm.runInContext(mcSlice, mcCtx);

  mcCtx.ensureMasterQuizSets(mcCtx.masterBooks[0]);
  mcCtx.ensureMasterQuizSets(mcCtx.masterBooks[1]);
  assert.equal(mcCtx.masterBooks[0].quizSets[0].questions[0].question, '');
  assert.equal(mcCtx.masterBooks[0].quizSets[0].questions[0].opt1, '');
  assert.equal(mcCtx.masterBooks[1].quizSets[0].questions[0].question, '');
  assert.doesNotMatch(JSON.stringify(mcCtx.masterBooks[0].quizSets), /도서의 중심 인물과 배경/);
  assert.deepEqual(Array.from(mcCtx.getChoicesFromQuestion({ type: 'CHOICE', question: '' })), ['', '', '']);

  mcCtx.currentQuizQuestions = JSON.parse(JSON.stringify(mcCtx.masterBooks[0].quizSets[0].questions));
  mcCtx.curQuizQuestionIdx = 0;
  mcCtx.loadCurrentQuizQuestionForm();
  assert.match(containerEl.innerHTML, /placeholder="예: 1번 선택지 내용을 입력하세요"/);
  getMcEl('mqQuestionText').value = '본사 1번 질문';
  renderedChoiceInputs[0].value = '본사 보기 1';
  mcCtx.addNewQuizQuestion();
  assert.equal(mcCtx.currentQuizQuestions[0].question, '본사 1번 질문');
  assert.equal(mcCtx.currentQuizQuestions[1].question, '');
  assert.equal(getMcEl('mqQuestionText').value, '');
  assert.deepEqual(renderedChoiceInputs.map(el => el.value), ['', '', '']);
  assert.equal(mcTracker.focusedIds.includes('mqQuestionText'), false);

  // 4) 레거시 admin_preview.js: addNewQuiz가 더미 질문 문자열을 주입하지 않아야 함
  const legacySrc = fs.readFileSync(path.join(rootDir, 'public_html/admin_preview.js'), 'utf8');
  const legacySlice = extractBlock(legacySrc, 'function addNewQuiz()', 'function deleteCurrentQuiz(');
  const legacyCtx = vm.createContext({
    quizDataList: [{ question: '기존 1번', opt1: 'a', opt2: 'b', opt3: 'c', opt4: 'd', ans: '1' }],
    currentQuizIndex: 0,
    updateCurrentQuizData() {},
    renderQuizTabs() {},
    loadCurrentQuizForm() {},
  });
  vm.runInContext(legacySlice, legacyCtx);
  legacyCtx.addNewQuiz();
  assert.equal(legacyCtx.quizDataList[1].question, '');
});

test('(All) 학생 랭킹 상단 배너에서 도서 최초 완료 100P · 최초 생각담기 50P 문구와 배지 영역을 제거한다', () => {
  const rootDir = path.join(__dirname, '..');
  const studentHtml = fs.readFileSync(path.join(rootDir, 'public_html/student_preview.html'), 'utf8');

  assert.equal(studentHtml.includes('도서 최초 완료'), false);
  assert.equal(studentHtml.includes('최초 생각담기'), false);
  assert.equal(studentHtml.includes('rankMyCharSpeech'), false);
  assert.equal(studentHtml.includes('my-rank-speech'), false);

  const fnStart = studentHtml.indexOf('function updateRankingHeaderTexts()');
  const fnEnd = studentHtml.indexOf('function switchRankPeriod(', fnStart);
  assert.ok(fnStart > 0 && fnEnd > fnStart, 'updateRankingHeaderTexts 함수를 찾을 수 없습니다');

  const els = {};
  const getEl = (id) => {
    if (!els[id]) els[id] = { textContent: '' };
    return els[id];
  };
  const rCtx = vm.createContext({
    currentRankPeriod: 'month',
    currentRankScope: 'class',
    remoteRankResult: {
      className: 'A Class',
      academyName: '주식회사 루크러닝',
      myPoints: 117,
      myTotalPoints: 244,
      myBooks: 5,
      myRank: 1,
      participants: 6,
    },
    readBooksMaster: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
    fullRankDatabase: { academy: { month: [] } },
    window: { NanoPortal: { remote: true }, MIGRATED_MEMBERS: [] },
    NanoPortal: { remote: true },
    getStudentQuizIdentity: () => ({ studentId: 'look1', classGroup: 'A Class', academyName: '주식회사 루크러닝' }),
    document: { getElementById: getEl },
  });
  vm.runInContext(studentHtml.slice(fnStart, fnEnd), rCtx);
  rCtx.updateRankingHeaderTexts();

  assert.equal(els.myRankHighlightText.textContent, '1위');
  assert.equal(els.myRankHighlightPercent.textContent, '(상위 17%)');
  assert.equal(els.myRankPeriodPoints.textContent, '117 P');
  assert.equal(els.myRankReadCountBadge.textContent, '완독 5권 · 누적 244P');
});

test('서비스 운영관리 배너 지정 도서 리스트와 학생앱 도서 리스트가 캐시·로컬스토리지·접두사 충돌 없이 정확히 일치한다', async () => {
  const rootDir = path.join(__dirname, '..');
  const auth = loadTs('lib/portal-auth.ts');
  const brand = require('./test-portal-brand.cjs')({});

  // 1) api/bootstrap.ts: 5분 catalogCache에 배너가 갇히지 않고 배너 도서 수정이 즉시 반영된다
  let currentDbBanners = [
    { id: 'bn-1', title: '12월 산타', imageUrl: '/img/b1.jpg', linkUrl: '#books=KA300010', isActive: true, orderNo: 1, updatedAt: new Date('2026-11-17T01:00:00Z') },
  ];
  let currentDbMeta = [
    { key: 'banner_meta:bn-1', scope: 'banner_meta', value: { brand: 'NANO', sub: '산타 도서', bookIds: ['KA300010'], clicks: 0, updatedAt: 1000 }, updatedAt: new Date('2026-11-17T01:00:00Z') },
  ];
  const studentMember = {
    id: 'std-1', username: 'look1', name: '박진호', role: 'STUDENT', status: 'APPROVED', password: 'pw',
    academyId: 'acad-1', academy: { id: 'acad-1', code: 'LOOK', name: '루크', status: 'ACTIVE', deletedAt: null, joinDate: new Date(), startDate: new Date(), endDate: new Date(), _count: { members: 1 } },
    classGroup: { id: 'cls-1', name: 'A' }, points: 0, bookCount: 0, quizAvg: 0, reportYn: true,
    createdAt: new Date(), updatedAt: new Date(),
  };
  const mockDb = {
    member: { findUnique: async () => studentMember, findMany: async () => [studentMember] },
    academy: { findMany: async () => [studentMember.academy] },
    portalFile: { findMany: async () => [] },
    book: { findMany: async () => [
      { id: 'b-fa', bookNo: 'FA300010', title: '다른 접두사 도서', author: 'A', publisher: 'P', grade: '초3', category: 'F', subCategory: 'A', series: '단권', _count: { quizzes: 3 }, theme: null },
      { id: 'b-ka', bookNo: 'KA300010', title: '산타 할아버지의 지도', author: '이혜옥', publisher: '웅진책', grade: '초3', category: 'K', subCategory: 'A', series: '단권', _count: { quizzes: 3 }, theme: null },
    ] },
    mainBanner: { findMany: async () => currentDbBanners },
    themeCategory: { findMany: async () => [] },
    classGroup: { findMany: async () => [] },
    notice: { findMany: async () => [] },
    academyBook: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    aligoDispatchLog: { findMany: async () => [] },
    quizAttempt: { groupBy: async () => [] },
    bookQuiz: { groupBy: async () => [
      { bookId: 'b-fa', legacyQuizSeq: 0, _count: { id: 3 } },
      { bookId: 'b-ka', legacyQuizSeq: 0, _count: { id: 3 } },
    ] },
    portalSetting: {
      findUnique: async () => null,
      findMany: async (q = {}) => {
        if (q?.where?.scope?.in && q.where.scope.in.includes('banner_meta')) return currentDbMeta;
        if (q?.where?.scope === 'banner_meta') return currentDbMeta;
        return [];
      },
    },
  };
  const modCache = new Map();
  const loadBootMod = (file) => {
    const abs = path.resolve(rootDir, file);
    if (modCache.has(abs)) return modCache.get(abs);
    if (abs === path.join(rootDir, 'lib/prisma.ts')) return { prisma: mockDb };
    if (!abs.endsWith('.ts')) return require(abs);
    const exports = {};
    modCache.set(abs, exports);
    const transpiled = ts.transpileModule(fs.readFileSync(abs, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localReq = (name) => {
      if (!name.startsWith('.')) return require(name);
      let target = path.resolve(path.dirname(abs), name);
      if (fs.existsSync(target + '.ts')) target += '.ts';
      else if (fs.existsSync(target + '.js')) target += '.js';
      return loadBootMod(target);
    };
    vm.runInNewContext(transpiled, {
      exports, require: localReq, Buffer, process, console, URL, URLSearchParams, Date, setTimeout, clearTimeout, fetch, AbortSignal,
    }, { filename: abs });
    return exports;
  };
  const bootExports = loadBootMod('api/bootstrap.ts');
  const token = auth.signSession('std-1', 'pw');
  const callBoot = async () => {
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, send(body) { this.body = body; return this; } };
    await bootExports.default({ method: 'GET', url: '/api/bootstrap', headers: { cookie: 'nano_portal=' + token, host: 'nanosbook.co.kr' } }, res);
    assert.equal(res.statusCode, 200, String(res.body || ''));
    const out = { window: {}, sessionStorage: { setItem() {} } };
    vm.runInNewContext(res.body, out);
    return out.window;
  };
  const firstWin = await callBoot();
  assert.deepEqual(Array.from(firstWin.NANO_SERVER_BANNERS[0].bookIds), ['KA300010']);

  // 배너 도서를 변경했을 때 5분 캐시에 갇히지 않고 즉시 새 목록 반환
  currentDbMeta = [
    { key: 'banner_meta:bn-1', scope: 'banner_meta', value: { brand: 'NANO', sub: '산타 도서', bookIds: ['KA300010', 'FA300010'], clicks: 0, updatedAt: 2000 }, updatedAt: new Date('2026-11-17T01:05:00Z') },
  ];
  const secondWin = await callBoot();
  assert.deepEqual(Array.from(secondWin.NANO_SERVER_BANNERS[0].bookIds), ['KA300010', 'FA300010']);

  // lib/portal-brand.ts: JD 전용 관리자에게도 /api/activity?action=banners 허용 확인
  assert.doesNotThrow(() => brand.guardRestrictedRequest(
    { method: 'GET', url: '/api/activity?action=banners', query: { action: 'banners' } },
    { role: 'MASTER', brandPolicy: 'JD_MASTER' }
  ));

  // 2) 마스터(master-core.js + master-operations.js): NANO에서도 localStorage가 서버 배너 bookIds를 덮어쓰지 않고, 접두사 교차 매칭을 방지한다
  const masterCoreSrc = fs.readFileSync(path.join(rootDir, 'public_html/js/master/master-core.js'), 'utf8');
  const masterOpsSrc = fs.readFileSync(path.join(rootDir, 'public_html/js/master/master-operations.js'), 'utf8');
  const extractBlock = (src, startMarker, endMarker) => {
    const start = src.indexOf(startMarker);
    const end = src.indexOf(endMarker, start);
    assert.ok(start >= 0 && end > start, `${startMarker} ~ ${endMarker} 블록 추출 실패`);
    return src.slice(start, end);
  };
  const masterParseSlice = extractBlock(masterCoreSrc, 'function parseBannerMetaFromLink(', '// 로컬스토리지 및 중앙 서버 동기화');
  const masterLoadSlice = extractBlock(masterCoreSrc, 'function loadOperationsFromStorage()', '// 1-5. 마스터 콘텐츠 도서 라이브러리 풀');
  const findBookSlice = extractBlock(masterOpsSrc, 'function findMasterBookByBannerBookId(', 'function renderBannerList(');
  const mcCtx = vm.createContext({
    window: {
      NANO_SERVER_DATA: true,
      NANO_BRAND: 'NANO',
      NANO_SERVER_BANNERS: [{ id: 'bn-1', title: '12월 산타', bookIds: ['KA300010'], isActive: true, active: 'Y' }],
      NANO_SERVER_THEMES: [],
      MIGRATED_BOOKS: [],
    },
    bannerList: [],
    themeList: [],
    defaultMasterThemeList: [],
    masterBooks: [
      { id: 'FA300010', bookNo: 'FA300010', title: '붉은 모자와 까만 원숭이', hasQuiz: true },
      { id: 'KA300010', bookNo: 'KA300010', title: '산타 할아버지의 지도', hasQuiz: true },
      { id: 'MB-001', bookNo: 'MB-001', title: '어린 왕자', hasQuiz: false },
    ],
    localStorage: {
      getItem: (k) => k === 'NANO_MASTER_BANNERS' ? JSON.stringify([{ id: 'bn-1', title: '12월 산타', bookIds: ['STALE_LOCAL'], updatedAt: Date.now() }]) : null,
      setItem() {},
    },
    URLSearchParams,
  });
  vm.runInContext(`let bannerList = []; let themeList = [];\n${masterParseSlice}\n${masterLoadSlice}\n${findBookSlice}`, mcCtx);
  mcCtx.loadOperationsFromStorage();
  assert.deepEqual(Array.from(mcCtx.window.NANO_SERVER_BANNERS[0].bookIds), ['KA300010']);
  assert.equal(mcCtx.findMasterBookByBannerBookId('KA300010')?.title, '산타 할아버지의 지도');
  assert.equal(mcCtx.findMasterBookByBannerBookId('KC300010'), null); // 다른 접두사가 FA300010으로 오매칭되면 안 됨
  assert.equal(mcCtx.findMasterBookByBannerBookId('1001')?.id, undefined); // 1001은 1에만 호환 (MB-001은 '1')
  assert.equal(mcCtx.findMasterBookByBannerBookId('1')?.id, 'MB-001');
  assert.equal(mcCtx.isMasterBannerBookVisibleToStudent({ hasQuiz: false, quizCount: 0 }), false);
  assert.equal(mcCtx.isMasterBannerBookVisibleToStudent({ hasQuiz: true, quizCount: 3 }), true);

  // 3) 학생앱(student_preview.html): NANO·JD 동일하게 서버 배너 신뢰, 접두사 교차 오매칭 차단, 마스터 순서 유지
  const studentHtml = fs.readFileSync(path.join(rootDir, 'public_html/student_preview.html'), 'utf8');
  const sBannerSlice = extractBlock(studentHtml, 'function parseStudentBannerLinkMeta(linkStr)', '// [전체 도서관 서브탭] 좌우 화살표');
  const sFilterSlice = extractBlock(studentHtml, 'function filterBannerTabBooks()', 'function clearBannerBookSearch()');
  const bannerListDom = { innerHTML: '' };
  const sCtx = vm.createContext({
    window: {
      NANO_SERVER_DATA: true,
      NANO_BRAND: 'NANO',
      NANO_SERVER_BANNERS: [
        { id: 'bn-1', title: '12월 산타', active: 'Y', bookIds: ['KA300010', 'FA300010'], linkUrl: '#books=KA300010,FA300010' },
      ],
    },
    libData: [
      { id: 'FA300010', bookNo: 'FA300010', title: '붉은 모자와 까만 원숭이', author: 'A', pub: 'P' },
      { id: 'KA300010', bookNo: 'KA300010', title: '산타 할아버지의 지도', author: '이혜옥', pub: '웅진책' },
      { id: 'MB-005', bookNo: 'MB-005', title: '레거시5', author: 'A', pub: 'P' },
    ],
    defaultStudentBanners: [],
    currentSelectedBannerId: 'bn-1',
    getAllLibRowHtml: (bk) => `<row>${bk.id}:${bk.title}</row>`,
    sortLibraryBooksForStudent: () => assert.fail('배너 도서 순서를 학생 학년순으로 뒤섞으면 안 됩니다'),
    localStorage: {
      getItem: () => assert.fail('NANO_SERVER_DATA=true일 때 localStorage의 오래된 배너 캐시를 읽으면 안 됩니다'),
    },
    document: {
      getElementById: (id) => (id === 'bannerTabBookList' ? bannerListDom : null),
    },
  });
  vm.runInContext(sBannerSlice + '\n' + sFilterSlice, sCtx);

  const resolvedBanners = sCtx.getStudentBanners();
  assert.equal(resolvedBanners.length, 1);
  // KA300010이 libData 앞에 있는 FA300010으로 오매칭되지 않고 정확한 책 + 지정 순서로 매핑되어야 함
  const resolvedBooks = sCtx.resolveBannerBooks({ bookIds: ['KA300010', 'KB300010'] });
  assert.deepEqual(Array.from(resolvedBooks.map(b => b.id)), ['KA300010']);
  assert.equal(sCtx.resolveBannerBooks({ bookIds: ['005'] })[0]?.id, 'MB-005');

  sCtx.filterBannerTabBooks();
  assert.equal(bannerListDom.innerHTML, '<row>KA300010:산타 할아버지의 지도</row><row>FA300010:붉은 모자와 까만 원숭이</row>');
});

test('학생 관심 주제 미설정 온보딩: Skip 후 재접속·재로그인 시 관심 주제 팝업이 다시 뜨고 임의 3개가 자동 선택되지 않으며 저장 후에만 비노출된다', async () => {
  const rootDir = path.join(__dirname, '..');
  const auth = loadTs('lib/portal-auth.ts');
  const pwHash = auth.hashPassword('pass-1234');
  const store = new Map();
  let studentRow = {
    id: 'std-first', username: 'newstd1', name: '신규학생', role: 'STUDENT', status: 'APPROVED', password: pwHash,
    lastLoginAt: null, points: 0, bookCount: 0, quizAvg: 0, reportYn: true,
    academyId: 'acad-1', academy: { id: 'acad-1', code: 'LOOK', name: '루크', status: 'ACTIVE', deletedAt: null, joinDate: new Date(), startDate: new Date(), endDate: new Date(), _count: { members: 1 } },
    classGroup: { id: 'cls-1', name: 'A' }, createdAt: new Date(), updatedAt: new Date(),
  };
  let directorRow = {
    id: 'dir-first', username: 'newdir1', name: '신규원장', role: 'DIRECTOR', status: 'APPROVED', password: pwHash,
    lastLoginAt: null, points: 0, bookCount: 0, quizAvg: 0, reportYn: true,
    academyId: 'acad-1', academy: studentRow.academy, classGroup: null, createdAt: new Date(), updatedAt: new Date(),
  };

  let currentUserRow = studentRow;
  const db = {
    member: {
      findUnique: async ({ where }) => (where.id === 'dir-first' || where.username === 'newdir1' ? directorRow : studentRow),
      findMany: async () => [currentUserRow],
      update: async ({ where, data }) => {
        if (where.id === 'dir-first') directorRow = { ...directorRow, ...data };
        else studentRow = { ...studentRow, ...data };
        return where.id === 'dir-first' ? directorRow : studentRow;
      },
    },
    academy: { findMany: async () => [studentRow.academy] },
    portalFile: { findMany: async () => [] },
    book: { findMany: async () => [] },
    mainBanner: { findMany: async () => [] },
    themeCategory: { findMany: async () => [] },
    classGroup: { findMany: async () => [] },
    notice: { findMany: async () => [] },
    academyBook: { findMany: async () => [] },
    payment: { findMany: async () => [] },
    aligoDispatchLog: { findMany: async () => [] },
    quizAttempt: { groupBy: async () => [] },
    bookQuiz: { groupBy: async () => [] },
    portalSetting: {
      findUnique: async ({ where }) => store.get(where.key) || null,
      findMany: async ({ where }) => {
        if (Array.isArray(where?.key?.in)) return where.key.in.map(k => store.get(k)).filter(Boolean);
        return [];
      },
      upsert: async ({ where, create, update }) => {
        const prev = store.get(where.key);
        const next = prev ? { ...prev, value: update.value, revision: (prev.revision || 1) + 1 } : { key: where.key, scope: create.scope, value: create.value, revision: 1 };
        store.set(where.key, next);
        return next;
      },
      create: async ({ data }) => {
        const row = { ...data, revision: 1 };
        store.set(data.key, row);
        return row;
      },
      updateMany: async ({ where, data }) => {
        const cur = store.get(where.key);
        if (!cur || cur.revision !== where.revision) return { count: 0 };
        store.set(where.key, { ...cur, value: data.value, revision: cur.revision + 1 });
        return { count: 1 };
      },
    },
  };

  const modCache = new Map();
  const loadApiMod = (file) => {
    const abs = path.resolve(rootDir, file);
    if (modCache.has(abs)) return modCache.get(abs);
    if (abs === path.join(rootDir, 'lib/prisma.ts')) return { prisma: db };
    if (!abs.endsWith('.ts')) return require(abs);
    const exports = {};
    modCache.set(abs, exports);
    const transpiled = ts.transpileModule(fs.readFileSync(abs, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const localReq = (n) => {
      if (!n.startsWith('.')) return require(n);
      let target = path.resolve(path.dirname(abs), n);
      if (!fs.existsSync(target)) {
        if (fs.existsSync(target + '.ts')) target += '.ts';
        else if (fs.existsSync(target + '.js')) target += '.js';
      }
      return loadApiMod(target);
    };
    vm.runInNewContext(transpiled, {
      exports, require: localReq, Buffer, process, console, URL, URLSearchParams, Date, setTimeout, clearTimeout, fetch, AbortSignal,
    }, { filename: abs });
    return exports;
  };

  const portalHandler = loadApiMod('api/portal.ts').default;
  const bootstrapHandler = loadApiMod('api/bootstrap.ts').default;
  const activityHandler = loadApiMod('api/activity.ts').default;

  const login = async (username) => {
    const res = {
      statusCode: 200, headers: {}, body: null,
      setHeader(k, v) { this.headers[k] = v; },
      status(c) { this.statusCode = c; return this; },
      json(v) { this.body = v; return this; },
    };
    await portalHandler({
      method: 'POST', query: { action: 'login' },
      headers: { host: 'nanosbook.co.kr', origin: 'https://nanosbook.co.kr', 'content-type': 'application/json' },
      body: { username, password: 'pass-1234', remember: false, confirmConcurrent: true },
    }, res);
    assert.equal(res.statusCode, 200, JSON.stringify(res.body));
    const cookieHeader = String(res.headers['Set-Cookie'] || '').split(';')[0];
    return cookieHeader;
  };
  const callBoot = async (cookie) => {
    const res = { headers: {}, statusCode: 200, setHeader() {}, status(c) { this.statusCode = c; return this; }, send(v) { this.body = v; return this; } };
    await bootstrapHandler({ method: 'GET', url: '/api/bootstrap', headers: { cookie, host: 'nanosbook.co.kr' } }, res);
    assert.equal(res.statusCode, 200);
    const out = { window: {}, sessionStorage: { setItem() {} } };
    vm.runInNewContext(res.body, out);
    return out.window;
  };

  // 원장(비학생) 최초 로그인은 학생 온보딩을 생성하지 않음
  currentUserRow = directorRow;
  await login('newdir1');
  assert.equal(store.get('onboarding_interest:dir-first'), undefined);

  // 학생 1차(최초) 로그인 -> PENDING 저장 -> bootstrap에서 NANO_FIRST_INTEREST_POPUP === true
  currentUserRow = studentRow;
  const firstCookie = await login('newstd1');
  assert.ok(studentRow.lastLoginAt instanceof Date);
  const firstBoot = await callBoot(firstCookie);
  assert.equal(firstBoot.NANO_FIRST_INTEREST_POPUP, true);

  // Skip 처리 -> 1회 응답은 SKIPPED이지만 아직 관심 주제를 저장하지 않았으므로 재접속(bootstrap)·재로그인 시 다시 팝업 노출
  const actRes = { statusCode: 200, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(v) { this.body = v; return this; } };
  await activityHandler({
    method: 'POST', query: { action: 'onboarding_interest' },
    headers: { cookie: firstCookie, host: 'nanosbook.co.kr', origin: 'https://nanosbook.co.kr', 'content-type': 'application/json' },
    body: { status: 'SKIPPED' },
  }, actRes);
  assert.equal(actRes.body.status, 'SKIPPED');
  const reconnectBoot = await callBoot(firstCookie);
  assert.equal(reconnectBoot.NANO_FIRST_INTEREST_POPUP, true);
  assert.deepEqual(Array.from(reconnectBoot.NANO_SERVER_PREFERENCES?.value?.interests || []), []);

  // 2차 로그인(재접속) -> 아직 관심 주제를 저장하지 않았으므로 계속 팝업 노출
  const secondCookie = await login('newstd1');
  assert.equal((await callBoot(secondCookie)).NANO_FIRST_INTEREST_POPUP, true);

  // 관심 주제 2개 저장 + SAVED 처리 -> 이후 재접속 및 3차 로그인에서 팝업 재노출되지 않음
  const prefSaveRes = { statusCode: 200, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(v) { this.body = v; return this; } };
  await activityHandler({
    method: 'POST', query: { action: 'preferences' },
    headers: { cookie: secondCookie, host: 'nanosbook.co.kr', origin: 'https://nanosbook.co.kr', 'content-type': 'application/json' },
    body: { value: { wishlist: [], interests: ['#이야기', '#과학'] }, revision: 0 },
  }, prefSaveRes);
  assert.equal(prefSaveRes.statusCode, 200);
  const actSaveRes = { statusCode: 200, body: null, setHeader() {}, status(c) { this.statusCode = c; return this; }, json(v) { this.body = v; return this; } };
  await activityHandler({
    method: 'POST', query: { action: 'onboarding_interest' },
    headers: { cookie: secondCookie, host: 'nanosbook.co.kr', origin: 'https://nanosbook.co.kr', 'content-type': 'application/json' },
    body: { status: 'SAVED' },
  }, actSaveRes);
  assert.equal(actSaveRes.body.status, 'SAVED');
  assert.equal((await callBoot(secondCookie)).NANO_FIRST_INTEREST_POPUP, false);
  const thirdCookie = await login('newstd1');
  assert.equal((await callBoot(thirdCookie)).NANO_FIRST_INTEREST_POPUP, false);

  // 프런트엔드 UI / Skip 시 빈 배열 유지(자동 3개 미선택) / 최대 3개 선택 / 저장 / JD 브랜드 스타일 검증
  const studentHtml = fs.readFileSync(path.join(rootDir, 'public_html/student_preview.html'), 'utf8');
  const brandCss = fs.readFileSync(path.join(rootDir, 'public_html/css/portal-brand.css'), 'utf8');
  assert.match(studentHtml, /id="firstLoginInterestModal"\s+class="student-modal-overlay"/);
  assert.match(studentHtml, /id="btnFirstInterestSkip"/);
  assert.match(studentHtml, /id="btnFirstInterestSave"/);
  assert.match(brandCss, /html\[data-brand="JD"\]\s+#firstLoginInterestModal\s+\.student-modal-header/);
  assert.match(brandCss, /html\[data-brand="JD"\]\s+\.first-interest-chip\.selected/);

  const prefStart = studentHtml.indexOf('var isInterestTagsExpanded = false;');
  const prefEnd = studentHtml.indexOf('// 포인트 적립 내역 데이터');
  const tagStart = studentHtml.indexOf('function toggleInterestTagsExpand()');
  const tagEnd = studentHtml.indexOf('function renderInterestRecommendations()', tagStart);
  const modalStart = studentHtml.indexOf('// 최초 로그인 1회 이벤트: 홈 메인 관심 주제 선택 팝업');
  const modalEnd = studentHtml.indexOf('document.addEventListener(\'DOMContentLoaded\'', modalStart);
  assert.ok(prefStart > 0 && prefEnd > prefStart && tagStart > 0 && tagEnd > tagStart && modalStart > 0 && modalEnd > modalStart);

  const els = {
    'p-home': { classList: { contains: (c) => c === 'active' } },
    firstLoginInterestModal: { style: { display: 'none' } },
    firstInterestTopicGrid: { innerHTML: '' },
    firstInterestCountBadge: { textContent: '' },
    btnFirstInterestSave: { disabled: true },
    libInterestTagsContainer: { innerHTML: '' },
    libUserInterestTagCount: { innerText: '' },
  };
  const postedCalls = [];
  const toasts = [];
  const uiCtx = vm.createContext({
    window: {
      NANO_SERVER_DATA: true,
      NANO_FIRST_INTEREST_POPUP: true,
      NANO_SERVER_PREFERENCES: { value: { wishlist: [], interests: [] }, revision: 0 },
      NanoPortal: { remote: true },
    },
    studentWishlist: [],
    allInterestTags: [],
    getStudentThemes: () => [
      { active: 'Y', title: '이야기' },
      { active: 'Y', title: '과학' },
      { active: 'Y', title: '역사' },
      { active: 'Y', title: '자연' },
    ],
    getAllInterestTags: () => ['#이야기', '#과학', '#역사', '#자연'],
    getStudentQuizIdentity: () => ({ memberId: 'std-first', studentId: 'newstd1' }),
    toast: (m) => toasts.push(m),
    renderInterestRecommendations: () => {},
    checkStudentNoticePopups: () => {},
    setTimeout: (fn) => fn(),
    fetch: async (url, init) => {
      postedCalls.push({ url, body: JSON.parse(init.body) });
      return { ok: true, json: async () => ({ ok: true, revision: 1 }) };
    },
    document: { getElementById: (id) => els[id] || null },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    sessionStorage: { getItem: () => null, removeItem() {} },
  });
  vm.runInContext(
    studentHtml.slice(prefStart, prefEnd) + '\n' +
    studentHtml.slice(tagStart, tagEnd) + '\n' +
    studentHtml.slice(modalStart, modalEnd),
    uiCtx
  );

  // 초기 상태: 관심 주제가 비어 있고, 맨 앞 3개 주제가 자동으로 들어가 있지 않아야 함
  assert.deepEqual(Array.from(uiCtx.userInterestTags), []);
  assert.equal(uiCtx.checkFirstLoginInterestPopup(), true);
  assert.equal(els.firstLoginInterestModal.style.display, 'flex');
  assert.equal(els.btnFirstInterestSave.disabled, true);

  // Skip 실행 -> 현재 화면 세션에서는 닫히되 userInterestTags 및 renderInterestTags 이후에도 빈 배열([]) 유지
  uiCtx.skipFirstLoginInterestModal();
  assert.equal(els.firstLoginInterestModal.style.display, 'none');
  assert.equal(uiCtx.checkFirstLoginInterestPopup(), false);
  assert.ok(postedCalls.some(c => c.url.includes('action=onboarding_interest') && c.body.status === 'SKIPPED'));
  assert.ok(!postedCalls.some(c => c.url.includes('action=preferences')));
  uiCtx.renderInterestTags();
  assert.deepEqual(Array.from(uiCtx.userInterestTags), []);
  assert.equal(els.libUserInterestTagCount.innerText, '0개 선택');
  assert.ok(!els.libInterestTagsContainer.innerHTML.includes('interest-tag-chip active'));

  // 재접속 시뮬레이션(NANO_FIRST_INTEREST_POPUP === true) -> 팝업이 다시 열리고 1~3개 선택/저장 동작
  uiCtx.window.NANO_FIRST_INTEREST_POPUP = true;
  assert.equal(uiCtx.checkFirstLoginInterestPopup(), true);
  assert.equal(els.firstLoginInterestModal.style.display, 'flex');

  // 1~3개 선택 및 4번째 선택 차단 확인
  uiCtx.toggleFirstLoginInterestTopicByIndex(0);
  uiCtx.toggleFirstLoginInterestTopicByIndex(1);
  assert.equal(els.btnFirstInterestSave.disabled, false);
  assert.equal(els.firstInterestCountBadge.textContent, '2 / 3개 선택');
  uiCtx.toggleFirstLoginInterestTopicByIndex(2);
  uiCtx.toggleFirstLoginInterestTopicByIndex(3);
  assert.equal(els.firstInterestCountBadge.textContent, '3 / 3개 선택');
  assert.ok(toasts.some(t => t.includes('최대 3개')));

  // 저장 실행 -> preferences + onboarding_interest('SAVED') 저장 후 팝업 닫힘 및 재오픈 차단
  uiCtx.saveFirstLoginInterestModal();
  assert.equal(els.firstLoginInterestModal.style.display, 'none');
  assert.deepEqual(Array.from(uiCtx.userInterestTags), ['#이야기', '#과학', '#역사']);
  assert.equal(uiCtx.checkFirstLoginInterestPopup(), false);
  assert.ok(postedCalls.some(c => c.url.includes('action=preferences') && c.body.value.interests.length === 3));
  assert.ok(postedCalls.some(c => c.url.includes('action=onboarding_interest') && c.body.status === 'SAVED'));
});

test('찜하기 및 북퀴즈 완료 안내 토스트가 도서명 기반 찜하기 및 북퀴즈 완료 문구로 표시된다', async () => {
  const rootDir = path.join(__dirname, '..');
  const extrasSrc = fs.readFileSync(path.join(rootDir, 'public_html/js/portal-extras.js'), 'utf8');
  const studentHtml = fs.readFileSync(path.join(rootDir, 'public_html/student_preview.html'), 'utf8');

  assert.equal(extrasSrc.includes('서버에 저장했습니다'), false);
  assert.equal(studentHtml.includes('답안을 서버에 저장했어요'), false);
  assert.equal(studentHtml.includes('답안을 이 기기에 저장했어요'), false);
  assert.equal(studentHtml.includes('퀴즈 결과는 '), false);
  assert.ok(studentHtml.includes("toast('북퀴즈를 완료했습니다. 결과를 확인해보세요.');"));

  const listeners = {};
  const toasts = [];
  const ctx = vm.createContext({
    libData: [{ id: 'KA1001', bookNo: 'KA1001', title: '너도 씨앗을 품게 될 거야' }],
    studentWishlist: [],
    userInterestTags: [],
    currentDetailBookId: null,
    curPointMonthFilter: 'all',
    studentPointLogs: [],
    hasMorePointLogs: false,
    isPointLoading: false,
    renderWishList() {},
    renderInterestTags() {},
    renderInterestRecommendations() {},
    updateDetailWishUI() {},
    updateAllCharacterAvatars() {},
    toast: (msg) => toasts.push(msg),
    URL,
    Blob: class {},
    document: { getElementById: () => null, querySelectorAll: () => [], createElement: () => ({ style: {} }), body: { append() {} } },
    window: null,
    NanoPortal: {
      remote: true,
      user: () => ({ role: 'student' }),
      activity: () => ({ pointLogs: [], pointNextCursor: null, pointMonths: [], currentMonthPoints: 0 }),
      api: async (url, body) => {
        if (url === '/api/activity?action=character') return { characterId: 'nano', hasSelection: true };
        if (url === '/api/activity?action=preferences' && !body) return { value: { wishlist: [], interests: [] }, revision: 0 };
        if (url === '/api/activity?action=preferences' && body) return { revision: (body.revision || 0) + 1 };
        return {};
      },
    },
    addEventListener: (name, fn) => { listeners[name] = fn; },
  });
  ctx.window = ctx;
  vm.runInContext(extrasSrc, ctx);
  await listeners['nano:ready']();

  await ctx.toggleWish('KA1001');
  assert.equal(toasts[toasts.length - 1], '너도 씨앗을 품게 될 거야을 찜했습니다.');

  await ctx.toggleWish('KA1001');
  assert.equal(toasts[toasts.length - 1], '너도 씨앗을 품게 될 거야 찜을 해제했습니다.');

  await ctx.toggleInterestTag('#자연');
  assert.equal(toasts[toasts.length - 1], '관심 주제가 저장되었습니다.');
});

test('공개 포털 HTML·JS·API 소스에 데모 계정/비밀번호, 비인증 초기 DOM 노출, 샘플 개인정보, 하드코딩 시크릿이 남아있지 않다', () => {
  const rootDir = path.join(__dirname, '..');
  const pubDir = path.join(rootDir, 'public_html');
  const indexHtml = fs.readFileSync(path.join(pubDir, 'index.html'), 'utf8');
  for (const leakedToken of ['quick-test-box', 'quickFillAndLogin', 'master00', 'admin01', 'teacher_park', 'student01', 'admin123', 'nano123!', 'nano1234!', '박선혜', '김은영', '김나노']) {
    assert.equal(indexHtml.includes(leakedToken), false, `index.html에 민감/체험 계정 문자열이 남아 있습니다: ${leakedToken}`);
  }

  for (const portalFile of ['student_preview.html', 'admin_preview.html', 'master_preview.html']) {
    const html = fs.readFileSync(path.join(pubDir, portalFile), 'utf8');
    assert.ok(html.includes("document.documentElement.style.visibility = 'hidden'"), `${portalFile} <head>에 비인증 사전 숨김 스크립트가 있어야 합니다`);
    for (const pii of ['이문성', '글봄독서논술학원', '안여진', '힘찬학당', '권순찬', '딱풀리는수학', '박선혜', 'teacher_park', '010-3342-9981']) {
      assert.equal(html.includes(pii), false, `${portalFile}에 하드코딩된 샘플/실제 이름·연락처가 남아 있습니다: ${pii}`);
    }
  }

  for (const jsRel of ['js/master/master-ranking.js', 'js/master/master-core.js', 'js/master/master-payment.js', 'js/master/master-members.js', 'js/master/master-franchise.js', 'js/admin_members.js', 'js/admin_myinfo.js', 'admin_preview.js', 'modals/master_modals.html']) {
    const src = fs.readFileSync(path.join(pubDir, jsRel), 'utf8');
    for (const bad of ['이문성', 'gb6721', '글봄독서논술학원', 'nano123!', 'nano1234!', 'look9932', '강태양', '김민준 학부모']) {
      assert.equal(src.includes(bad), false, `${jsRel}에 하드코딩된 샘플 개인정보 또는 기본 비밀번호가 남아 있습니다: ${bad}`);
    }
  }

  const servicesTs = fs.readFileSync(path.join(rootDir, 'api', 'services.ts'), 'utf8');
  assert.equal(servicesTs.includes('nano-bookshelf-public-secret-key-2026'), false, 'api/services.ts에 하드코딩된 폴백 시크릿이 남아 있으면 안 됩니다');
  const manageTs = fs.readFileSync(path.join(rootDir, 'api', 'manage.ts'), 'utf8');
  assert.equal(manageTs.includes('nano123!'), false, 'api/manage.ts에 하드코딩된 기본 비밀번호가 남아 있으면 안 됩니다');
});

test('마스터 배너 숨김 전환 시 기존 isActive=true 잔존값에 의해 덮어써지지 않고 서버에 isActive=false로 저장된다', async () => {
  const rootDir = path.join(__dirname, '..');
  const pubDir = path.join(rootDir, 'public_html');
  const portalClientSrc = fs.readFileSync(path.join(pubDir, 'js/portal-client.js'), 'utf8');
  const masterOpsSrc = fs.readFileSync(path.join(pubDir, 'js/master/master-operations.js'), 'utf8');
  const toggleMatch = masterOpsSrc.match(/async function toggleBannerActive\(id\) \{[\s\S]*?\n\}/);
  assert.ok(toggleMatch, 'toggleBannerActive 함수가 있어야 합니다');

  let sentBodies = [];
  let shouldFail = false;
  const ctx = vm.createContext({
    NANO_SERVER_DATA: true,
    location: { protocol: 'https:', hostname: 'www.nanosbook.co.kr', pathname: '/master_preview.html', replace() {} },
    sessionStorage: { getItem: () => JSON.stringify({ role: 'master', academyId: 'HQ' }), setItem() {}, removeItem() {} },
    localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    document: { readyState: 'loading', documentElement: { style: {} }, getElementById: () => null, addEventListener() {} },
    addEventListener() {},
    URLSearchParams,
    AbortSignal,
    AbortController,
    Date,
    console,
    fetch: async (url, opts) => {
      const parsed = JSON.parse(opts.body);
      sentBodies.push(parsed);
      if (shouldFail) {
        return { ok: false, status: 500, json: async () => ({ error: '저장 오류' }) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ item: { id: 'bn-1', isActive: parsed.data.isActive, bookIds: ['KA1001'], updatedAt: 123456 } })
      };
    },
    bannerList: [{ id: 'bn-1', title: '테스트 배너', imageUrl: 'upload/banner/test.jpg', active: 'Y', isActive: true, bookIds: ['KA1001'], order: 1 }],
    getEffectiveBannerBookIds: (b) => b.bookIds || [],
    saveOperationsToStorage() {},
    renderBannerList() {},
    showMasterToast() {},
  });
  ctx.window = ctx;
  vm.runInContext(portalClientSrc + '\n' + toggleMatch[0], ctx);

  await ctx.toggleBannerActive('bn-1');
  assert.equal(sentBodies.length, 1);
  assert.equal(sentBodies[0].data.isActive, false, '숨김 전환 시 서버에 isActive: false가 전송되어야 합니다');
  assert.equal(ctx.bannerList[0].active, 'N');
  assert.equal(ctx.bannerList[0].isActive, false);

  shouldFail = true;
  await ctx.toggleBannerActive('bn-1');
  assert.equal(ctx.bannerList[0].active, 'N', '서버 저장 실패 시 이전 숨김 상태로 원복되어야 합니다');
  assert.equal(ctx.bannerList[0].isActive, false);
});
