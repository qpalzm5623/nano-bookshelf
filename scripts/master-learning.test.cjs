const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

process.env.PORTAL_AUTH_SECRET = 'test-only-secret-with-more-than-32-characters';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';

function loadTs(file, dependencies = {}) {
  if (/^api\/portal\.ts$/.test(file)) {
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
  vm.runInNewContext(code, {
    exports,
    require: name => dependencies[name] || require(name),
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

function buildMember(role = 'MASTER', overrides = {}) {
  return {
    id: 'member-' + role.toLowerCase(),
    username: 'user_' + role.toLowerCase(),
    name: role === 'MASTER' ? '마스터 운영자' : '검증 사용자',
    role,
    status: 'APPROVED',
    password: hash,
    academyId: 'acad-hq',
    academy: { code: 'HQ', name: '나노의책장 본사', status: 'ACTIVE', deletedAt: null },
    classGroup: { name: '본사반' },
    ...overrides
  };
}

function buildHandler(user, extraDb = {}) {
  const db = {
    member: { findUnique: async () => user, update: async () => user },
    academy: {
      findUnique: async ({ where }) => {
        if (where.code === 'ACAD-042') {
          return { id: 'acad-42', code: 'ACAD-042', name: '대치 리딩클럽', status: 'ACTIVE', deletedAt: null };
        }
        return null;
      }
    },
    portalFile: { findMany: async () => [] },
    book: { findMany: async () => [] },
    ...extraDb
  };
  const http = loadTs('lib/portal-http.ts', { './prisma': { prisma: db }, './portal-auth': auth });
  const saveAttempt = async () => ({ attempt: {}, earned: 0, isCertified: false });
  return loadTs('api/portal.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-auth': auth,
    '../lib/portal-http': http,
    '../lib/portal-learning': { ...loadTs('lib/portal-learning.ts'), saveAttempt }
  }).default;
}

function makeReq(query, token) {
  return {
    query: { action: 'learning', ...query },
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

test('마스터는 전국(ALL) DB 학습 이력을 조회할 수 있고 academyName 및 summary 경량화를 반환한다', async () => {
  const masterUser = buildMember('MASTER');
  let capturedWhere = null;
  const sampleAttempt = {
    id: 'L_db_real_01',
    bookId: 'book-uuid-1',
    score: 100,
    correctCount: 5,
    completedAt: new Date('2026-11-12T03:00:00.000Z'),
    thinkReply: '주인공의 용기가 멋졌어요.',
    member: {
      id: 'stu-1',
      username: 'stu1',
      name: '홍서연',
      school: '해운대초',
      grade: '초등 3학년',
      academy: { id: 'acad-42', code: 'ACAD-042', name: '부산 해운대 가맹점' },
      classGroup: { name: '해바라기반' }
    },
    answers: {
      quizResults: [{ qNum: 1, question: '질문1', userChoiceText: '보기1', correctChoiceText: '보기1', isCorrect: true }],
      thoughtQuestion: '인상 깊은 장면은?',
      reviewed: '첨삭 완료',
      sheet: '작성 완료',
      worksheetPhotos: [{ dataUrl: 'data:image/png;base64,AAA' }],
      worksheetAiResult: { summary: '우수함' }
    }
  };

  const run = buildHandler(masterUser, {
    quizAttempt: {
      findMany: async ({ where }) => {
        capturedWhere = where;
        return [sampleAttempt];
      }
    },
    book: {
      findMany: async () => [
        { id: 'book-uuid-1', bookNo: 'FA000001', title: '수호의 하얀 말', publisher: '한림출판사', author: '오츠카 유우조', coverUrl: '/upload/book/fa1.jpg', grade: '초등 3학년' }
      ]
    }
  });

  const token = auth.signSession(masterUser.id, hash);
  // 1) summary=1 전국 조회
  const resList = makeRes();
  await run(makeReq({ academy: 'ALL', summary: '1', startDate: '2026-11-01', endDate: '2026-11-13' }, token), resList);
  assert.equal(resList.code, 200);
  assert.equal(JSON.stringify(capturedWhere.member), JSON.stringify({ academy: { deletedAt: null } }));
  assert.ok(capturedWhere.completedAt.gte instanceof Date);
  assert.ok(capturedWhere.completedAt.lte instanceof Date);
  assert.equal(resList.data.logs.length, 1);
  assert.equal(resList.data.logs[0].academyName, '부산 해운대 가맹점');
  assert.equal(resList.data.logs[0].worksheetPhotos.length, 0);
  assert.equal(resList.data.logs[0].worksheetPhotoCount, 1);

  // 2) 단건 상세(id) 조회 시 원본 사진 포함 반환
  const resDetail = makeRes();
  await run(makeReq({ academy: 'ALL', id: 'L_db_real_01' }, token), resDetail);
  assert.equal(resDetail.code, 200);
  assert.equal(capturedWhere.id, 'L_db_real_01');
  assert.equal(resDetail.data.logs[0].worksheetPhotos.length, 1);
  assert.equal(resDetail.data.logs[0].quizResults.length, 1);
});

test('마스터가 특정 가맹점·클래스·검색어로 조회할 수 있고 일반 학원은 타 학원(ALL 포함) 조회가 차단된다', async () => {
  const masterUser = buildMember('MASTER');
  let capturedWhere = null;
  const runMaster = buildHandler(masterUser, {
    quizAttempt: {
      findMany: async ({ where }) => {
        capturedWhere = where;
        return [];
      }
    },
    book: {
      findMany: async () => [{ id: 'b-99', bookNo: 'BK99' }]
    }
  });

  const masterToken = auth.signSession(masterUser.id, hash);
  const resMaster = makeRes();
  await runMaster(makeReq({ academy: 'ACAD-042', classGroup: '소나무반', search: '오즈' }, masterToken), resMaster);
  assert.equal(resMaster.code, 200);
  assert.equal(capturedWhere.member.academyId, 'acad-42');
  assert.equal(JSON.stringify(capturedWhere.member.classGroup), JSON.stringify({ name: '소나무반' }));
  assert.ok(Array.isArray(capturedWhere.OR));

  // 일반 원장/교사가 academy=ALL 또는 타 가맹점 파라미터를 넘기면 403 거부
  for (const role of ['DIRECTOR', 'TEACHER', 'STUDENT']) {
    const nonMaster = buildMember(role, { id: 'member-' + role });
    const runOther = buildHandler(nonMaster);
    const resOther = makeRes();
    await runOther(makeReq({ academy: 'ALL' }, auth.signSession(nonMaster.id, hash)), resOther);
    assert.equal(resOther.code, 403);
  }
});

test('마스터 UI/스크립트에 카톡 버튼·alert가 제거되고 검색형 드롭다운·실DB 연동·학습리포트 모달이 동작한다', async () => {
  const masterJsPath = path.join(__dirname, '..', 'public_html', 'js', 'master', 'master-learning.js');
  const masterHtmlPath = path.join(__dirname, '..', 'public_html', 'master_preview.html');
  const masterJs = fs.readFileSync(masterJsPath, 'utf8');
  const masterHtml = fs.readFileSync(masterHtmlPath, 'utf8');

  assert.equal(masterJs.includes('sendMasterLearningKakao'), false);
  assert.equal(masterJs.includes('alert('), false);
  assert.match(masterHtml, /id="masterLearningAcademyDropdown"/);
  assert.match(masterHtml, /id="masterLearningAcademySearchInput"/);
  assert.match(masterHtml, /id="masterLearningReportModal"/);
  assert.doesNotMatch(masterHtml, /<input[^>]+id="masterLearningStartDate"[^>]+onchange=/i);
  assert.doesNotMatch(masterHtml, /<input[^>]+id="masterLearningEndDate"[^>]+onchange=/i);

  // 경량 DOM 목업을 통해 실제 DB 모드 동작(가짜 더미 차단 + 드롭다운 검색 + 리포트 상세) 검증
  function makeEl(id) {
    return {
      id,
      value: '',
      textContent: '',
      innerHTML: '',
      src: '',
      alt: '',
      style: {},
      options: [],
      listeners: {},
      classList: {
        _set: new Set(),
        add(c) { this._set.add(c); },
        remove(c) { this._set.delete(c); },
        contains(c) { return this._set.has(c); }
      },
      addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
      dispatchEvent(ev) { (this.listeners[ev.type] || []).forEach(fn => fn(ev)); },
      setAttribute() {},
      getAttribute(name) { return this['_' + name] || null; },
      focus() {},
      contains() { return false; },
      querySelectorAll() { return []; }
    };
  }

  const ids = [
    'masterLearningAcademyFilter', 'masterLearningAcademyDropdown', 'masterLearningAcademyTrigger',
    'masterLearningAcademyLabel', 'masterLearningAcademyMenu', 'masterLearningAcademySearchInput',
    'masterLearningAcademySearchClear', 'masterLearningAcademyOptions', 'masterLearningClassFilter',
    'masterLearningStartDate', 'masterLearningEndDate', 'masterLearningSearchInput',
    'masterLearningTableBody', 'masterLearningLogCount', 'masterLearningPagination',
    'masterLearningStatMonthlyCount', 'masterLearningStatMonthlySub', 'masterLearningStatAvgScore',
    'masterLearningStatPassSub', 'masterLearningStatReviewRate', 'masterLearningStatReviewSub',
    'masterLearningReportModal', 'masterReportLoadingState', 'masterReportSubtitle',
    'masterReportCoverImg', 'masterReportBookGrade', 'masterReportEarnedPoints',
    'masterReportBookTitle', 'masterReportBookPub', 'masterReportAcademy',
    'masterReportDate', 'masterReportStudent', 'masterReportStudentSub',
    'masterReportScore', 'masterReportPassBadge', 'masterReportCertifiedBadge',
    'masterReportQuizSummary', 'masterReportQuizDetailContainer', 'masterReportThoughtSection',
    'masterReportThoughtQuestion', 'masterReportThoughtAnswer', 'masterReportThoughtVisibilityBadge',
    'masterReportThoughtCommentWrap', 'masterReportThoughtComment', 'masterReportWorksheetSection',
    'masterReportSheetBadge', 'masterReportReviewBadge', 'masterReportWorksheetPhotos',
    'masterReportWorksheetSummary', 'masterReportWorksheetNextStep', 'masterReportWorksheetParentGuide'
  ];

  const elMap = Object.fromEntries(ids.map(id => [id, makeEl(id)]));
  elMap.masterLearningAcademyFilter.value = 'ALL';
  elMap.masterLearningClassFilter.value = 'ALL';
  elMap.masterLearningClassFilter.options = [{ value: 'ALL' }];

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
    Map,
    encodeURIComponent,
    setTimeout,
    document: {
      body: makeEl('body'),
      getElementById: id => elMap[id] || null,
      querySelector: () => null,
      addEventListener: () => {}
    },
    $: selector => ({
      modal(action) {
        if (selector === '#masterLearningReportModal' && action === 'show') modalShown = true;
      }
    }),
    MIGRATED_FRANCHISES: [
      { id: 'HQ', name: '나노의책장 본사' },
      { id: 'ACAD-002', name: '서초 에듀클래스' },
      { id: 'ACAD-042', name: '부산 해운대 리딩' }
    ],
    MIGRATED_MEMBERS: [],
    MIGRATED_BOOKS: [],
    NANO_SERVER_DATA: true,
    NanoPortal: {
      remote: true,
      async api(url) {
        apiCalls.push(url);
        if (url.includes('&id=L_REAL_99')) {
          return {
            logs: [{
              id: 'L_REAL_99',
              academyId: 'ACAD-042',
              academyName: '부산 해운대 리딩',
              studentId: 'seoyeon01',
              studentName: '홍서연',
              classGroup: '해바라기반',
              school: '해운대초 3학년',
              bookId: 'FA000123',
              bookTitle: '수호의 하얀 말',
              bookPub: '한림출판사 · 오츠카 유우조',
              cover: '/upload/book/suho.jpg',
              grade: '초등 3학년',
              date: '2026-11-12',
              submittedAt: '2026-11-12T04:20:00.000Z',
              score: 100,
              earnedPoints: 30,
              correctCount: 5,
              reviewed: '첨삭 완료',
              sheet: '작성 완료',
              thoughtQuestion: '하얀 말은 누구인가요?',
              studentThoughtAnswer: '소중한 친구였습니다.',
              thoughtTeacherComment: '깊이 있게 읽었네요.',
              quizResults: [
                { qNum: 1, question: '첫 번째 문제는?', userChoiceText: '정답 보기', correctChoiceText: '정답 보기', isCorrect: true }
              ],
              worksheetPhotos: [{ dataUrl: 'data:image/png;base64,iVBOR' }],
              worksheetAiResult: { summary: '문해력이 뛰어납니다.', nextStep: '근거를 더 써보세요.', parentGuide: '칭찬해 주세요.' }
            }]
          };
        }
        if (url.includes('academy=ACAD-002')) {
          return { logs: [] };
        }
        return {
          logs: [{
            id: 'L_REAL_99',
            academyId: 'ACAD-042',
            academyName: '부산 해운대 리딩',
            studentId: 'seoyeon01',
            studentName: '홍서연',
            classGroup: '해바라기반',
            bookTitle: '수호의 하얀 말',
            bookPub: '한림출판사 · 오츠카 유우조',
            date: '2026-11-12',
            submittedAt: '2026-11-12T04:20:00.000Z',
            score: 100,
            reviewed: '첨삭 완료',
            sheet: '작성 완료',
            worksheetPhotos: [],
            worksheetPhotoCount: 1,
            quizResults: []
          }]
        };
      }
    }
  };
  sandbox.window = sandbox;

  vm.runInNewContext(masterJs, sandbox);

  // initMasterLearning + 즉시 연속 executeMasterLearningSearch 호출 시 중복 API 호출이 1회로 병합되는지 확인
  const p1 = sandbox.initMasterLearning();
  const p2 = sandbox.executeMasterLearningSearch();
  await Promise.all([p1, p2]);

  assert.equal(apiCalls.length, 1);
  assert.match(apiCalls[0], /^\/api\/portal\?action=learning&summary=1&limit=500&academy=ALL/);
  assert.equal(elMap.masterLearningClassFilter.disabled, true);
  assert.equal(elMap.masterLearningClassFilter.value, 'ALL');
  assert.match(elMap.masterLearningClassFilter.innerHTML, /가맹점 먼저 선택/);
  assert.match(elMap.masterLearningTableBody.innerHTML, /홍서연/);
  assert.match(elMap.masterLearningTableBody.innerHTML, /부산 해운대 리딩/);
  assert.doesNotMatch(elMap.masterLearningTableBody.innerHTML, /박지후|김태윤/);
  assert.doesNotMatch(elMap.masterLearningTableBody.innerHTML, /카톡/);

  // 가맹점 검색어 입력 시 옵션만 필터링되고 서버 호출은 발생하지 않아야 함
  elMap.masterLearningAcademySearchInput.value = '해운대';
  elMap.masterLearningAcademySearchInput.dispatchEvent({ type: 'input' });
  assert.equal(apiCalls.length, 1);
  assert.match(elMap.masterLearningAcademyOptions.innerHTML, /부산 해운대 리딩/);
  assert.doesNotMatch(elMap.masterLearningAcademyOptions.innerHTML, /서초 에듀클래스/);

  // 가맹점 선택 시 클래스 필터만 활성화·갱신되고, 조회 버튼 클릭 전까지는 서버 호출이 발생하지 않아야 함
  await sandbox.selectMasterAcademyOption('ACAD-042');
  assert.equal(elMap.masterLearningAcademyFilter.value, 'ACAD-042');
  assert.equal(elMap.masterLearningAcademyLabel.textContent, '부산 해운대 리딩');
  assert.equal(elMap.masterLearningClassFilter.disabled, false);
  assert.match(elMap.masterLearningClassFilter.innerHTML, /해바라기반/);
  assert.doesNotMatch(elMap.masterLearningClassFilter.innerHTML, /소나무반/);
  assert.equal(apiCalls.length, 1);

  await sandbox.executeMasterLearningSearch();
  assert.equal(apiCalls.length, 2);
  assert.match(apiCalls[1], /academy=ACAD-042/);

  // 학습리포트 클릭 시 단건 API 조회 후 실제 모달 데이터 바인딩 검증
  await sandbox.openMasterLearningReportDetail('L_REAL_99');
  assert.equal(modalShown, true);
  assert.equal(apiCalls.length, 3);
  assert.equal(apiCalls[2], '/api/portal?action=learning&id=L_REAL_99');
  assert.equal(elMap.masterReportBookTitle.textContent, '수호의 하얀 말');
  assert.equal(elMap.masterReportScore.textContent, '100점');
  assert.match(elMap.masterReportQuizDetailContainer.innerHTML, /첫 번째 문제는\?/);
  assert.equal(elMap.masterReportThoughtAnswer.textContent, '소중한 친구였습니다.');
  assert.equal(elMap.masterReportWorksheetSummary.textContent, '문해력이 뛰어납니다.');
  assert.match(elMap.masterReportWorksheetPhotos.innerHTML, /data:image\/png;base64,iVBOR/);

  // 전체 가맹점으로 복귀 시 클래스 필터 비활성화+ALL 초기화만 수행하고, 빈 가맹점 조회 시 로딩 스피너 없이 빈 상태가 렌더돼야 함
  elMap.masterLearningClassFilter.value = '해바라기반';
  elMap.masterLearningStartDate.value = '2025-01-02';
  elMap.masterLearningEndDate.value = '2025-01-19';
  await sandbox.selectMasterAcademyOption('ALL');
  assert.equal(elMap.masterLearningClassFilter.disabled, true);
  assert.equal(elMap.masterLearningClassFilter.value, 'ALL');
  assert.equal(apiCalls.length, 3);

  await sandbox.selectMasterAcademyOption('ACAD-002');
  assert.equal(apiCalls.length, 3);
  await sandbox.executeMasterLearningSearch();
  assert.equal(apiCalls.length, 4);
  assert.match(apiCalls[3], /academy=ACAD-002/);
  assert.match(apiCalls[3], /startDate=2025-01-02/);
  assert.match(apiCalls[3], /endDate=2025-01-19/);
  assert.equal(apiCalls[3].includes('classGroup='), false);
  assert.doesNotMatch(elMap.masterLearningTableBody.innerHTML, /불러오는 중/);
  assert.match(elMap.masterLearningTableBody.innerHTML, /<td[^>]+colspan/i);

  // 인쇄 레이아웃·드롭다운 클리핑 방지 CSS & 초기 클래스 필터 disabled 검증
  const masterCss = fs.readFileSync(path.join(__dirname, '..', 'public_html', 'css', 'master_preview.css'), 'utf8');
  const portalSearchCss = fs.readFileSync(path.join(__dirname, '..', 'public_html', 'css', 'portal-search.css'), 'utf8');
  const printBlock = masterCss.slice(masterCss.indexOf('@media print'));
  assert.match(masterHtml, /css\/master_preview\.css\?v=20261113_dropdown_fix/);
  assert.match(masterHtml, /css\/portal-search\.css\?v=20261113_dropdown_fix/);
  assert.match(masterHtml, /js\/master\/master-learning\.js\?v=20261113_query_only/);
  assert.match(masterHtml, /<select[^>]+id="masterLearningClassFilter"[^>]+disabled/);
  assert.match(masterCss, /\.master-filter-toolbar-card[\s\S]*overflow:\s*visible\s*!important/);
  assert.match(portalSearchCss, /\.simple-card:has\(>\s*\.portal-search-toolbar\)[\s\S]*overflow:\s*visible\s*!important/);
  assert.match(printBlock, /html\s*\{[^}]*height:\s*auto\s*!important;[^}]*overflow:\s*visible\s*!important;/);
  assert.match(printBlock, /body\.printing-master-report[\s\S]*display:\s*block\s*!important;[\s\S]*height:\s*auto\s*!important;[\s\S]*overflow:\s*visible\s*!important;/);
  assert.match(printBlock, /#masterLearningReportModal\s+\.modal-content[\s\S]*overflow:\s*visible\s*!important;/);
  assert.match(printBlock, /\.master-report-overview-split[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.15fr\)\s*minmax\(0,\s*1fr\)\s*!important;/);
  assert.match(printBlock, /\.master-report-quiz-grid[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important;/);
  assert.match(masterJs, /beforeprint/);
});
