const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const createPortalContent = require('./test-portal-content.cjs');

function loadTs(relPath, mocks) {
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const mod = { exports: {} };
  const fn = new Function('require', 'module', 'exports', code);
  fn(name => (mocks[name] !== undefined ? mocks[name] : require(name)), mod, mod.exports);
  return mod.exports;
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    headersSent: false,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(payload) { this.body = payload; this.headersSent = true; return this; },
    send(payload) { this.body = payload; this.headersSent = true; return this; },
    end() { this.headersSent = true; }
  };
}

function makeContentHandler(state) {
  const http = {
    need(condition, message, status = 400) {
      if (!condition) throw Object.assign(new Error(message), { status });
    },
    staff(user) {
      if (!['MASTER', 'DIRECTOR', 'TEACHER'].includes(user.role)) throw Object.assign(new Error('권한 없음'), { status: 403 });
    },
    text(value, label, max = 200, required = false) {
      const result = String(value == null ? '' : value).trim();
      if (result.length > max || (required && !result) || /[<>]/.test(result)) {
        throw Object.assign(new Error(label + ' 내용을 확인해 주세요.'), { status: 400 });
      }
      return result;
    },
    authenticate: async () => state.currentUser,
    failure(res, error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  };
  const portalContent = createPortalContent(http);
  const prisma = {
    academy: {
      findMany: async () => state.academies
    },
    book: {
      findMany: async () => state.books
    },
    bookQuiz: {
      groupBy: async () => state.quizGroups
    },
    member: {
      findMany: async ({ where }) => {
        const ids = where?.username?.in || [];
        return state.members.filter(m =>
          ids.includes(m.username) &&
          m.role === 'DIRECTOR' &&
          m.status === 'APPROVED' &&
          m.academy && m.academy.status === 'ACTIVE' && !m.academy.deletedAt
        );
      }
    },
    portalSetting: {
      findMany: async ({ where }) => {
        const scopes = where?.scope?.in || [];
        return state.settings.filter(s => scopes.includes(s.scope));
      },
      create: async ({ data }) => {
        const row = { ...data, revision: 1 };
        state.settings.push(row);
        return row;
      },
      updateMany: async ({ where, data }) => {
        const target = state.settings.find(s => s.key === where.key && s.scope === where.scope && s.revision === where.revision);
        if (!target) return { count: 0 };
        target.value = data.value;
        target.revision += 1;
        return { count: 1 };
      },
      deleteMany: async ({ where }) => {
        const before = state.settings.length;
        state.settings = state.settings.filter(s => !(s.key === where.key && s.scope === where.scope));
        return { count: before - state.settings.length };
      }
    }
  };
  return loadTs('api/content.ts', {
    '../lib/prisma': { prisma },
    '../lib/portal-http': http,
    '../lib/portal-content': portalContent
  }).default;
}

test('학원장 ID 조회 API는 승인된 활성 학원의 원장만 반환하고 타 역할·비활성·자기 학원은 거부한다', async () => {
  const state = {
    academies: [
      { id: 'acad-1', code: 'A001', name: '에크라임 학원', status: 'ACTIVE', deletedAt: null },
      { id: 'acad-2', code: 'A002', name: '나노 강남 학원', status: 'ACTIVE', deletedAt: null },
      { id: 'acad-3', code: 'A003', name: '휴원 학원', status: 'INACTIVE', deletedAt: null }
    ],
    members: [
      { id: 'u1', username: 'lee_dir', name: '이정민', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-1', academy: { id: 'acad-1', name: '에크라임 학원', status: 'ACTIVE', deletedAt: null } },
      { id: 'u2', username: 'kim_dir', name: '김나노', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-2', academy: { id: 'acad-2', name: '나노 강남 학원', status: 'ACTIVE', deletedAt: null } },
      { id: 'u3', username: 'park_tea', name: '박교사', role: 'TEACHER', status: 'APPROVED', academyId: 'acad-2', academy: { id: 'acad-2', name: '나노 강남 학원', status: 'ACTIVE', deletedAt: null } },
      { id: 'u4', username: 'sleep_dir', name: '휴원원장', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-3', academy: { id: 'acad-3', name: '휴원 학원', status: 'INACTIVE', deletedAt: null } }
    ],
    books: [],
    quizGroups: [],
    settings: [],
    currentUser: null
  };
  state.currentUser = state.members[0];
  const handler = makeContentHandler(state);

  // 유효한 타 학원 원장 조회 성공
  let res = makeRes();
  await handler({ method: 'GET', query: { action: 'director', username: ' kim_dir ' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.item.username, 'kim_dir');
  assert.equal(res.body.item.directorName, '김나노');
  assert.equal(res.body.item.academyName, '나노 강남 학원');

  // 교사 ID 조회 거부
  res = makeRes();
  await handler({ method: 'GET', query: { action: 'director', username: 'park_tea' } }, res);
  assert.equal(res.statusCode, 400);

  // 비활성 학원 원장 ID 조회 거부
  res = makeRes();
  await handler({ method: 'GET', query: { action: 'director', username: 'sleep_dir' } }, res);
  assert.equal(res.statusCode, 400);

  // 우리 학원 원장 ID 조회 거부
  res = makeRes();
  await handler({ method: 'GET', query: { action: 'director', username: 'lee_dir' } }, res);
  assert.equal(res.statusCode, 400);

  // 존재하지 않는 ID 거부
  res = makeRes();
  await handler({ method: 'GET', query: { action: 'director', username: 'unknown_user' } }, res);
  assert.equal(res.statusCode, 400);
});

test('마스터(본사)는 본사 퀴즈·나노시트만 공유 후보로 조회하며 타 학원 등록물은 제외하고, 학원은 academyCode 기반 레거시 시트도 인식한다', async () => {
  const state = {
    academies: [
      { id: 'acad-hq', code: 'HQ', name: '본사', status: 'ACTIVE', deletedAt: null },
      { id: 'acad-a', code: 'ACAD-A', name: 'A학원', status: 'ACTIVE', deletedAt: null }
    ],
    members: [
      { id: 'master-1', username: 'master', name: '본사관리자', role: 'MASTER', status: 'APPROVED', academyId: 'acad-hq', academy: { id: 'acad-hq', name: '본사', status: 'ACTIVE', deletedAt: null } },
      { id: 'dir-a', username: 'dir_a', name: 'A원장', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-a', academy: { id: 'acad-a', name: 'A학원', status: 'ACTIVE', deletedAt: null } }
    ],
    books: [
      { id: 'b-hq', bookNo: 'HQ001', title: '본사 도서', author: '작가1', publisher: '출판1', grade: '초등 4학년', coverUrl: '/c1.png', worksheetUrl: 'https://r2.example.com/hq.pdf' },
      { id: 'b-hq-pub', bookNo: 'HQ002', title: '본사 전체공개 도서', author: '작가0', publisher: '출판0', grade: '초등 4학년', coverUrl: '', worksheetUrl: '' },
      { id: 'b-acad-code', bookNo: 'AC001', title: 'A학원 도서', author: '작가2', publisher: '출판2', grade: '초등 5학년', coverUrl: '/c2.png', worksheetUrl: 'https://r2.example.com/ac.pdf' },
      { id: 'b-acad-quiz', bookNo: 'AC002', title: 'A학원 퀴즈 도서', author: '작가3', publisher: '출판3', grade: '초등 6학년', coverUrl: '', worksheetUrl: '' }
    ],
    quizGroups: [
      { bookId: 'b-hq', legacyQuizSeq: 1, _count: { id: 5 } },
      { bookId: 'b-hq-pub', legacyQuizSeq: 2, _count: { id: 5 } },
      { bookId: 'b-acad-quiz', legacyQuizSeq: -12345, _count: { id: 4 } }
    ],
    settings: [
      { key: 'book_creator:AC001', scope: 'book_creator', revision: 1, value: { academyCode: 'ACAD-A', academyName: 'A학원' } },
      { key: 'quiz_seq:-12345', scope: 'quiz_author_seq', revision: 1, value: { academyId: 'acad-a', academyName: 'A학원', authorType: 'ACADEMY' } },
      { key: 'content_quiz:b-hq:1', scope: 'content_quiz', revision: 1, value: { bookId: 'b-hq', seq: 1, authorType: 'HQ', ownerAcademyId: 'acad-hq', academyName: '본사', isPublic: 'N' } },
      { key: 'content_quiz:b-hq-pub:2', scope: 'content_quiz', revision: 1, value: { bookId: 'b-hq-pub', seq: 2, authorType: 'HQ', ownerAcademyId: 'acad-hq', academyName: '본사', isPublic: 'Y' } },
      { key: 'content_sheet:legacy-b-acad-code', scope: 'content_sheet', revision: 1, value: { id: 'legacy-b-acad-code', bookId: 'b-acad-code', academyCode: 'ACAD-A', ownerAcademyId: 'acad-a', academyName: 'A학원', authorType: 'ACADEMY', isPublic: 'N' } },
      { key: 'content_quiz:b-acad-quiz:-12345', scope: 'content_quiz', revision: 1, value: { bookId: 'b-acad-quiz', seq: -12345, ownerAcademyId: 'acad-a', academyName: 'A학원', authorType: 'ACADEMY', isPublic: 'N' } }
    ],
    currentUser: null
  };
  const handler = makeContentHandler(state);

  // 마스터 카탈로그: 비공개 항목이 있는 본사 도서(b-hq)만 포함, 전체 공개 도서(b-hq-pub)와 타 학원 도서는 제외
  state.currentUser = state.members[0];
  let res = makeRes();
  await handler({ method: 'GET', query: { action: 'catalog' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.items.map(i => i.id), ['b-hq']);
  assert.equal(res.body.items[0].quizCount, 5);
  assert.equal(res.body.items[0].hasPrivateQuiz, true);
  assert.equal(res.body.items[0].hasSheet, true);

  // A학원 원장 카탈로그: 비공개 시트(b-acad-code)와 비공개 퀴즈(b-acad-quiz) 모두 포함
  state.currentUser = state.members[1];
  res = makeRes();
  await handler({ method: 'GET', query: { action: 'catalog' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.items.map(i => i.id).sort(), ['b-acad-code', 'b-acad-quiz']);
});

test('공유 폴더 삭제 API는 본인이 만든 폴더만 삭제한다', async () => {
  const state = {
    academies: [{ id: 'acad-1', code: 'A1', name: '학원1', status: 'ACTIVE', deletedAt: null }],
    members: [
      { id: 'u1', username: 'dir1', name: '원장1', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-1', academy: { id: 'acad-1', name: '학원1', status: 'ACTIVE', deletedAt: null } },
      { id: 'u2', username: 'dir2', name: '원장2', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-1', academy: { id: 'acad-1', name: '학원1', status: 'ACTIVE', deletedAt: null } }
    ],
    books: [],
    quizGroups: [],
    settings: [
      { key: 'content_folder:f-1', scope: 'content_folder', revision: 1, value: { id: 'f-1', name: '폴더1', ownerMemberId: 'u1', ownerAcademyId: 'acad-1', bookIds: [], recipients: [] } }
    ],
    currentUser: null
  };
  const handler = makeContentHandler(state);

  // 타인의 삭제 시도 거부
  state.currentUser = state.members[1];
  let res = makeRes();
  await handler({ method: 'POST', query: { action: 'folder' }, body: { operation: 'delete', id: 'f-1' } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(state.settings.length, 1);

  // 본인 삭제 성공
  state.currentUser = state.members[0];
  res = makeRes();
  await handler({ method: 'POST', query: { action: 'folder' }, body: { operation: 'delete', id: 'f-1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(state.settings.length, 0);
});

test('마스터/학원 페이지와 콘텐츠 공유 프런트엔드 파일에 단계별 모달, 필터·정렬, 최신 스크립트 캐시 키가 연결되어 있다', () => {
  const masterHtml = fs.readFileSync(path.join(__dirname, '../public_html/master_preview.html'), 'utf8');
  const adminHtml = fs.readFileSync(path.join(__dirname, '../public_html/admin_preview.html'), 'utf8');
  const masterCore = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-core.js'), 'utf8');
  const sharingJs = fs.readFileSync(path.join(__dirname, '../public_html/js/content-sharing.js'), 'utf8');

  assert.match(masterHtml, /id="nav-master-content-sharing"/);
  assert.match(masterHtml, /id="tab-master-content-sharing"/);
  assert.match(masterHtml, /id="view-content-sharing"/);
  assert.doesNotMatch(masterHtml, /master-core\.js\?v=20261112_pf_v2/);
  assert.match(masterHtml, /master-core\.js\?v=20261113_center/);
  assert.match(masterHtml, /content-sharing\.css\?v=20261113_sharing_v7/);
  assert.match(masterHtml, /content-sharing\.js\?v=20261113_center/);
  assert.match(adminHtml, /content-sharing\.css\?v=20261113_sharing_v7/);
  assert.match(adminHtml, /content-sharing\.js\?v=20261113_center/);
  assert.match(masterCore, /'content-sharing'/);
  assert.match(masterCore, /ContentSharing\.refresh\(\)/);
  assert.match(sharingJs, /action=director&username=/);
  assert.match(sharingJs, /id="sharingDirectorLookupBtn"/);
  assert.match(sharingJs, /openCreateFolderModal/);
  assert.match(sharingJs, /openRecipientsModal/);
  assert.match(sharingJs, /openFolderBooksModal/);
  assert.match(sharingJs, /openReceivedFolderModal/);
  assert.match(sharingJs, /data-received-folder=/);
  assert.match(sharingJs, /sharing-kpi-subcount/);
  assert.match(sharingJs, /id="sharingGradeFilter"/);
  assert.match(sharingJs, /id="sharingSortDateBtn"/);
  assert.match(sharingJs, /id="sharingSortTitleBtn"/);
  assert.match(sharingJs, /id="sharingSelectedBookListBox"/);
  assert.match(sharingJs, /data-recipients-folder/);
  assert.match(sharingJs, /data-vis-radio=/);
  assert.match(sharingJs, /sharingNewSheetVis/);
  assert.doesNotMatch(sharingJs, /범위 저장/);
  assert.doesNotMatch(sharingJs, /sharingFilterPills/);

  // 프런트엔드 ContentSharing.refresh() / openReceivedFolderModal() 실행 검증 (KPI 총 권수 및 모달 리스트)
  const makeEl = () => {
    const el = {
      innerHTML: '',
      value: '',
      textContent: '',
      style: {},
      dataset: {},
      className: '',
      classList: { toggle: () => {}, add: () => {}, remove: () => {} },
      listeners: {},
      showModalCalled: false,
      showModal() { this.showModalCalled = true; },
      close() {},
      remove() {},
      setAttribute() {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      querySelector(sel) {
        if (!el._q) el._q = {};
        if (!el._q[sel]) el._q[sel] = makeEl();
        return el._q[sel];
      },
      querySelectorAll() { return []; }
    };
    return el;
  };
  const rootEl = makeEl();
  const createdDialogs = [];
  const win = {
    fetch: async (url) => ({
      ok: true,
      status: 200,
      json: async () => url.includes('action=folders')
        ? {
            items: [
              {
                id: 'own-1',
                name: '내가 공유한 1번 폴더',
                bookIds: ['b1', 'b2'],
                books: [
                  { id: 'b1', bookNo: 'B1', title: '가나다 책', author: '작가1', grade: '초3' },
                  { id: 'b2', bookNo: 'B2', title: '다라마 책', author: '작가2', grade: '초4' }
                ],
                recipients: [
                  { academyId: 'ac-1', academyName: '루크러닝', directorName: '이정민', username: 'lookadmin' }
                ]
              },
              {
                id: 'own-2',
                name: '내가 공유한 2번 폴더',
                bookIds: ['b2'],
                books: [
                  { id: 'b2', bookNo: 'B2', title: '다라마 책', author: '작가2', grade: '초4' }
                ],
                recipients: [
                  { academyId: 'ac-1', academyName: '루크러닝', directorName: '이정민', username: 'lookadmin' },
                  { academyId: 'ac-2', academyName: '다온학원', directorName: '홍길동', username: 'daon' }
                ]
              },
              {
                id: 'own-3',
                name: '수신 학원 미지정 폴더',
                bookIds: ['b3'],
                books: [
                  { id: 'b3', bookNo: 'B3', title: '바사아 책', author: '작가3', grade: '초5' }
                ],
                recipients: []
              }
            ],
            received: [
              { id: 'rec-1', name: '테스트 1번 폴더', ownerAcademyName: '본사', books: [
                { id: 'b1', bookNo: 'B1', title: '가나다 책', author: '작가1', grade: '초3' },
                { id: 'b2', bookNo: 'B2', title: '다라마 책', author: '작가2', grade: '초4' }
              ] },
              { id: 'rec-2', name: '추가 폴더', ownerAcademyName: '본사', books: [
                { id: 'b2', bookNo: 'B2', title: '다라마 책', author: '작가2', grade: '초4' },
                { id: 'b3', bookNo: 'B3', title: '바사아 책', author: '작가3', grade: '초5' }
              ] }
            ]
          }
        : {
            items: [
              { id: 'b1', bookNo: 'B1', title: '가나다 책' },
              { id: 'b2', bookNo: 'B2', title: '다라마 책' },
              { id: 'b3', bookNo: 'B3', title: '바사아 책' }
            ]
          }
    }),
    document: {
      getElementById: (id) => (id === 'view-content-sharing' ? rootEl : null),
      createElement: () => { const d = makeEl(); createdDialogs.push(d); return d; },
      body: { appendChild: () => {} }
    },
    confirm: () => true,
    alert: () => {},
    Set, Map, Array, String, Number, Date, Object, Math, Promise, encodeURIComponent
  };
  win.window = win;
  vm.runInNewContext(sharingJs, win);
  // refresh() 호출 후 공유 가능한 내 도서(공유 중 N권), 내가 공유한 폴더(공유 학원 N곳), 공유받은 폴더 KPI가 모두 정확히 집계되는지 확인
  return win.ContentSharing.refresh().then(() => {
    assert.match(rootEl.innerHTML, /3<span>권<\/span>[\s\S]*공유 중 <strong>2<\/strong>권/);
    assert.match(rootEl.innerHTML, /3<span>개<\/span>[\s\S]*공유 학원 <strong>2<\/strong>곳/);
    assert.match(rootEl.innerHTML, /내가 공유한 폴더 <span class="badge-soft badge-soft-neutral">3개 · 공유 학원 2곳<\/span>/);
    assert.match(rootEl.innerHTML, /2<span>개<\/span>/);
    assert.match(rootEl.innerHTML, /총 <strong>3<\/strong>권/);
    assert.match(rootEl.innerHTML, /data-received-folder="rec-1"/);
    win.ContentSharing.openReceivedFolderModal('rec-1');
    assert.equal(createdDialogs.length, 1);
    assert.equal(createdDialogs[0].showModalCalled, true);
    assert.match(createdDialogs[0].innerHTML, /테스트 1번 폴더/);
    const modalListEl = createdDialogs[0].querySelector('#sharingReceivedBookListBox');
    assert.match(modalListEl.innerHTML, /가나다 책/);
    assert.match(modalListEl.innerHTML, /다라마 책/);
  });
});

test('마스터 계정은 소속 academy 객체가 비어 있어도 folders 조회와 폴더 생성이 정상 동작한다', async () => {
  const state = {
    academies: [{ id: 'acad-a', code: 'A', name: 'A학원', status: 'ACTIVE', deletedAt: null }],
    members: [
      { id: 'master-hq', username: 'master', name: '마스터', role: 'MASTER', status: 'APPROVED', academyId: null, academy: null },
      { id: 'dir-a', username: 'dir_a', name: 'A원장', role: 'DIRECTOR', status: 'APPROVED', academyId: 'acad-a', academy: { id: 'acad-a', name: 'A학원', status: 'ACTIVE', deletedAt: null } }
    ],
    books: [{ id: 'b-hq', bookNo: 'HQ1', title: '본사 책', author: '저자', publisher: '출판사', grade: '초3', coverUrl: '', worksheetUrl: 'https://r2.example.com/hq.pdf' }],
    quizGroups: [],
    settings: [
      { key: 'content_sheet:legacy-b-hq', scope: 'content_sheet', revision: 1, value: { id: 'legacy-b-hq', bookId: 'b-hq', authorType: 'HQ', ownerAcademyId: 'acad-hq', academyName: '본사', isPublic: 'N' } }
    ],
    currentUser: null
  };
  const handler = makeContentHandler(state);
  state.currentUser = state.members[0];

  let res = makeRes();
  await handler({ method: 'GET', query: { action: 'folders' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { items: [], received: [] });

  res = makeRes();
  await handler({ method: 'POST', query: { action: 'folder' }, body: { name: '본사 배포 폴더', bookIds: ['b-hq'], directorUsernames: ['dir_a'] } }, res);
  assert.equal(res.statusCode, 200);
  const savedFolder = state.settings.find(s => s.scope === 'content_folder');
  assert.equal(savedFolder.value.ownerAcademyName, '본사');
});

test('나노시트 관리 모달은 드롭다운/범위저장 대신 공개/비공개 라디오 버튼으로 즉시 상태를 반영한다', async () => {
  const sharingJs = fs.readFileSync(path.join(__dirname, '../public_html/js/content-sharing.js'), 'utf8');
  const savedRequests = [];
  let sheetIsPublic = 'Y';
  const makeEl = (tag) => {
    const el = {
      tagName: String(tag || 'div').toUpperCase(),
      innerHTML: '',
      value: '',
      checked: false,
      disabled: false,
      textContent: '',
      style: {},
      dataset: {},
      className: '',
      showModal() {},
      close() {},
      remove() {},
      setAttribute() {},
      addEventListener() {},
      closest() { return null; },
      querySelector(sel) {
        if (!el._q) el._q = {};
        if (!el._q[sel]) el._q[sel] = makeEl('div');
        return el._q[sel];
      },
      querySelectorAll(sel) {
        return el._all && el._all[sel] ? el._all[sel] : [];
      }
    };
    return el;
  };

  let createdDialog = null;
  const radioPub = Object.assign(makeEl('input'), { value: 'Y', checked: true, dataset: { visRadio: '0' } });
  const radioPriv = Object.assign(makeEl('input'), { value: 'N', checked: false, dataset: { visRadio: '0' } });
  const win = {
    NANO_SERVER_DATA: true,
    fetch: async (url, init) => {
      if (init && init.method === 'POST' && url.includes('action=worksheet')) {
        const body = JSON.parse(init.body);
        savedRequests.push(body);
        if (body.isPublic) sheetIsPublic = body.isPublic;
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          canUpload: true,
          items: [{ id: 'sheet-1', name: '시트1.pdf', academyName: '본사', isPublic: sheetIsPublic, isMine: true, revision: 1, url: '/api/content?action=sheet-file&id=sheet-1' }]
        })
      };
    },
    document: {
      getElementById: () => null,
      createElement: (tag) => {
        createdDialog = makeEl(tag);
        createdDialog._all = {
          'input[data-vis-radio]': [radioPub, radioPriv]
        };
        return createdDialog;
      },
      body: { appendChild: () => {} }
    },
    confirm: () => true,
    alert: () => {},
    Set, Map, Array, String, Number, Date, Object, Math, Promise, encodeURIComponent
  };
  win.window = win;
  vm.runInNewContext(sharingJs, win);

  await win.ContentSharing.openSheets(
    { id: 'b-hq', serverId: 'b-hq', title: '테스트 도서' },
    () => {},
    { mode: 'manage' }
  );

  const renderedHtml = createdDialog.innerHTML;
  assert.doesNotMatch(renderedHtml, /<select\b/i);
  assert.doesNotMatch(renderedHtml, /범위 저장/);
  assert.match(renderedHtml, /type="radio"[^>]*name="sharingSheetVis_0"[^>]*value="Y"[^>]*checked/);
  assert.match(renderedHtml, /type="radio"[^>]*name="sharingNewSheetVis"[^>]*value="Y"[^>]*checked/);
  assert.equal(typeof radioPriv.onchange, 'function');

  // '비공개' 라디오 클릭 시 별도 저장 버튼 없이 즉시 서버 반영
  radioPub.checked = false;
  radioPriv.checked = true;
  await radioPriv.onchange();

  assert.equal(savedRequests.length, 1);
  assert.equal(savedRequests[0].isPublic, 'N');
  assert.equal(savedRequests[0].id, 'sheet-1');
  const updatedHtml = createdDialog.querySelector('#sharingSheetBody').innerHTML;
  assert.match(updatedHtml, /type="radio"[^>]*name="sharingSheetVis_0"[^>]*value="N"[^>]*checked/);
});

test('마스터 북퀴즈 저장 시 /api/content?action=quiz로 공개 여부(isPublic)를 저장하고 공유 선택 UI CSS가 정의된다', () => {
  const masterJs = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8');
  const sharingCss = fs.readFileSync(path.join(__dirname, '../public_html/css/content-sharing.css'), 'utf8');
  const sharingJs = fs.readFileSync(path.join(__dirname, '../public_html/js/content-sharing.js'), 'utf8');

  // openMasterQuizModal이 _quizLoadedFromServer 기준으로 항상 서버 최신 seq/isPublic을 조회하는지 확인
  assert.match(masterJs, /if\s*\(\s*window\.NANO_SERVER_DATA\s*&&\s*!book\._quizLoadedFromServer\s*&&/);

  // 공용 저장 헬퍼 persistMasterQuizToServer가 구 syncQuizzes 대신 /api/content?action=quiz에 isPublic을 전달하고 라디오·저장 버튼 모두가 이를 사용하는지 확인
  const helperMatch = masterJs.match(/async function persistMasterQuizToServer\([\s\S]*?\n\}/);
  assert.ok(helperMatch, 'persistMasterQuizToServer 함수를 찾을 수 없습니다');
  const helperBody = helperMatch[0];
  assert.doesNotMatch(helperBody, /NanoPortal\.syncQuizzes/);
  assert.match(helperBody, /\/api\/content\?action=quiz/);
  assert.match(helperBody, /isPublic:\s*targetIsPublic/);
  assert.match(helperBody, /\/api\/portal\?action=quiz&bookId=/);

  const saveFnMatch = masterJs.match(/async function handleSaveMasterQuizOnly\(\)[\s\S]*?\n\}/);
  assert.ok(saveFnMatch, 'handleSaveMasterQuizOnly 함수를 찾을 수 없습니다');
  assert.doesNotMatch(saveFnMatch[0], /NanoPortal\.syncQuizzes/);
  assert.match(saveFnMatch[0], /persistMasterQuizToServer/);

  const toggleFnMatch = masterJs.match(/async function onMasterQuizSetPublicChanged\(val\)[\s\S]*?\n\}/);
  assert.ok(toggleFnMatch, 'onMasterQuizSetPublicChanged 함수를 찾을 수 없습니다');
  assert.match(toggleFnMatch[0], /persistMasterQuizToServer/);

  // 공유 도서 모달의 버튼·선택됨 뱃지·비활성화 체크박스 CSS 규칙 검증
  assert.match(sharingJs, /class="sharing-text-btn sharing-text-btn-select" id="sharingSelectVisibleBtn"/);
  assert.match(sharingJs, /class="sharing-text-btn sharing-text-btn-clear" id="sharingClearBooksBtn"/);
  assert.match(sharingJs, /sharing-selected-pill/);
  assert.match(sharingCss, /\.sharing-text-btn\s*\{/);
  assert.match(sharingCss, /\.sharing-text-btn-select\s*\{/);
  assert.match(sharingCss, /\.sharing-text-btn-clear\s*\{/);
  assert.match(sharingCss, /\.sharing-book-row\s+input\[type="checkbox"\]:disabled\s*\{/);
  assert.match(sharingCss, /\.sharing-selected-pill\s*\{/);
});

test('마스터 북퀴즈 공개/비공개 라디오 클릭 시 별도 저장 없이 즉시 서버에 반영된다', async () => {
  const masterJs = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-contents.js'), 'utf8');
  const toggleSlice = masterJs.match(/async function onMasterQuizSetPublicChanged\(val\)[\s\S]*?\n\}/);
  const saveSlice = masterJs.match(/function isMasterQuizServerMode\(\)[\s\S]*?async function handleSaveMasterQuizOnly\(\)[\s\S]*?\n\}/);
  assert.ok(toggleSlice && saveSlice, '마스터 퀴즈 저장 함수 블록을 추출하지 못했습니다');

  const apiCalls = [];
  let refreshedCount = 0;
  let serverIsPublic = 'Y';
  const radY = { checked: true, disabled: false };
  const radN = { checked: false, disabled: false };
  const questions = [
    { type: 'CHOICE', question: '1번 문제?', choices: ['보기A', '보기B', '보기C'], ans: '2', hint: '해설' }
  ];
  const book = {
    id: 'B-100',
    serverId: 'srv-book-100',
    bookNo: 'B-100',
    title: '테스트 도서',
    quizSets: [{ id: 's-0', seq: 0, revision: 0, authorType: 'HQ', authorName: '본사', isPublic: 'Y', questions }]
  };

  const sandbox = {
    masterBooks: [book],
    curQuizTargetBookId: 'B-100',
    curQuizSetIdx: 0,
    currentQuizQuestions: questions,
    MIGRATED_QUIZZES: {},
    saveCurrentQuizDraft() {},
    renderQuizSetTabs() {},
    renderMasterContents() {},
    showMasterToast() {},
    validateMasterQuizQuestions: () => true,
    getChoicesFromQuestion: q => q.choices || [],
    $: () => ({ modal() {} }),
    ContentSharing: { refresh() { refreshedCount++; } },
    NanoPortal: {
      remote: true,
      async api(url, body) {
        apiCalls.push({ url, body });
        if (url === '/api/content?action=quiz') {
          serverIsPublic = body.isPublic;
          return { ok: true, seq: 0 };
        }
        if (url.startsWith('/api/portal?action=quiz')) {
          return { quizSets: [{ id: 's-0', seq: 0, revision: 1, authorType: 'HQ', authorName: '본사', isPublic: serverIsPublic, questions }] };
        }
        return {};
      }
    },
    document: {
      getElementById: id => (id === 'mqSetPublicY' ? radY : id === 'mqSetPublicN' ? radN : null),
      querySelector: () => null
    }
  };
  sandbox.window = sandbox;
  sandbox.NANO_SERVER_DATA = true;

  vm.runInNewContext(toggleSlice[0] + '\n' + saveSlice[0], sandbox);
  await sandbox.onMasterQuizSetPublicChanged('N');

  const postCall = apiCalls.find(c => c.url === '/api/content?action=quiz');
  assert.ok(postCall, '/api/content?action=quiz 호출이 누락되었습니다');
  assert.equal(postCall.body.bookId, 'srv-book-100');
  assert.equal(postCall.body.isPublic, 'N');
  assert.equal(book.quizSets[0].isPublic, 'N');
  assert.equal(book.quizSets[0].revision, 1);
  assert.equal(refreshedCount, 1);
  assert.equal(radN.disabled, false);
});

test('공유 폴더 도서 관리 좌측 목록은 선택됨 표시와 체크박스 비활성화를 적용하고 우측에서만 제거할 수 있다', async () => {
  const sharingJs = fs.readFileSync(path.join(__dirname, '../public_html/js/content-sharing.js'), 'utf8');

  let fetchCatalogCount = 0;
  const catalogItems = [
    { id: 'b1', bookNo: 'K1', title: '비공개 퀴즈 도서', author: '작가1', grade: '초3', hasPrivateQuiz: true, privateQuizCount: 5, hasPrivateSheet: false },
    { id: 'b2', bookNo: 'K2', title: '비공개 시트 도서', author: '작가2', grade: '초4', hasPrivateQuiz: false, hasPrivateSheet: true }
  ];

  const makeEl = (tag) => {
    let html = '';
    const el = {
      tagName: tag,
      value: '',
      scrollTop: 0,
      textContent: '',
      dataset: {},
      classList: { toggle() {}, add() {}, remove() {} },
      addEventListener() {},
      showModal() {},
      remove() {},
      setAttribute() {},
      closest() { return null; },
      close() {},
      querySelector(sel) {
        if (!el._q) el._q = {};
        if (!el._q[sel]) el._q[sel] = makeEl('div');
        return el._q[sel];
      },
      querySelectorAll(sel) {
        if (sel === 'input[type="checkbox"]' && el._boxes) return el._boxes;
        if (sel === '[data-remove-book]' && el._removeBtns) return el._removeBtns;
        return [];
      },
      set innerHTML(v) {
        html = String(v);
        if (html.includes('type="checkbox"')) {
          el._boxes = [...html.matchAll(/<input\s+type="checkbox"\s+value="([^"]+)"([^>]*)>/g)].map(m => ({
            value: m[1],
            checked: /\bchecked\b/.test(m[2]),
            disabled: /\bdisabled\b/.test(m[2]),
            onchange: null
          }));
        } else {
          el._boxes = [];
        }
        if (html.includes('data-remove-book=')) {
          el._removeBtns = [...html.matchAll(/data-remove-book="([^"]+)"/g)].map(m => ({
            dataset: { removeBook: m[1] },
            onclick: null
          }));
        } else {
          el._removeBtns = [];
        }
      },
      get innerHTML() {
        return html;
      }
    };
    return el;
  };

  let createdDialog = null;
  const rootEl = makeEl('div');
  const win = {
    NANO_SERVER_DATA: true,
    fetch: async (url) => {
      if (url.includes('action=folders')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [{ id: 'f1', name: '테스트 폴더', bookIds: ['b1'], books: [catalogItems[0]], recipients: [], revision: 1 }],
            received: []
          })
        };
      }
      if (url.includes('action=catalog')) {
        fetchCatalogCount++;
        return { ok: true, status: 200, json: async () => ({ items: catalogItems }) };
      }
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    },
    document: {
      getElementById: id => (id === 'view-content-sharing' ? rootEl : null),
      createElement: (tag) => {
        createdDialog = makeEl(tag);
        return createdDialog;
      },
      body: { appendChild() {} }
    },
    confirm: () => true,
    alert: () => {},
    Set, Map, Array, String, Number, Date, Object, Math, Promise, encodeURIComponent
  };
  win.window = win;
  vm.runInNewContext(sharingJs, win);

  await win.ContentSharing.refresh();
  const countAfterRefresh = fetchCatalogCount;

  await win.ContentSharing.openFolderBooksModal('f1');
  assert.equal(fetchCatalogCount, countAfterRefresh + 1, '모달을 열 때마다 최신 카탈로그를 재조회해야 합니다');

  const bookBox = createdDialog.querySelector('#sharingBookListBox');
  const selectedBox = createdDialog.querySelector('#sharingSelectedBookListBox');

  // 1) 초기 선택된 b1은 좌측 체크박스가 checked + disabled 상태이고 '선택됨' 표시가 있어야 함
  assert.match(bookBox.innerHTML, /<input type="checkbox" value="b1" checked disabled>/);
  assert.match(bookBox.innerHTML, /data-book-id="b1"[\s\S]*?선택됨/);
  assert.match(bookBox.innerHTML, /<input type="checkbox" value="b2">/);

  // 2) 좌측 체크박스에서 임의로 체크 해제(onchange)를 시도해도 선택 목록에서 제거되지 않아야 함
  const leftB1 = bookBox.querySelectorAll('input[type="checkbox"]').find(b => b.value === 'b1');
  leftB1.checked = false;
  leftB1.onchange();
  assert.equal(leftB1.checked, true);
  assert.equal(leftB1.disabled, true);
  assert.match(selectedBox.innerHTML, /data-remove-book="b1"/);

  // 3) 우측 제거 버튼(X)을 클릭해야 비로소 우측에서 제거되고 좌측 체크박스 활성화 및 '선택됨' 제거가 반영됨
  const removeB1Btn = selectedBox.querySelectorAll('[data-remove-book]').find(b => b.dataset.removeBook === 'b1');
  removeB1Btn.onclick();
  assert.doesNotMatch(selectedBox.innerHTML, /data-remove-book="b1"/);
  assert.match(bookBox.innerHTML, /<input type="checkbox" value="b1">/);
  assert.doesNotMatch(bookBox.innerHTML, /sharing-selected-pill/);
});

