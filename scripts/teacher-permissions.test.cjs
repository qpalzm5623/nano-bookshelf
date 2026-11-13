const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const createPortalContent = require('./test-portal-content.cjs');

const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public_html');

function readPublic(relPath) {
  return fs.readFileSync(path.join(publicDir, relPath), 'utf8');
}

function loadTsModule(relPath, mocks) {
  const source = fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  const mod = { exports: {} };
  const fn = new Function('require', 'module', 'exports', transpiled);
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
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; this.headersSent = true; return this; },
    send(payload) { this.body = payload; this.headersSent = true; return this; },
    end() { this.headersSent = true; }
  };
}

function makeContentHandler(currentUser) {
  const http = {
    need(condition, message, status = 400) {
      if (!condition) throw Object.assign(new Error(message), { status });
    },
    staff(user) {
      if (!['MASTER', 'DIRECTOR', 'TEACHER'].includes(user.role)) {
        throw Object.assign(new Error('권한 없음'), { status: 403 });
      }
    },
    text(value, label, max = 200, required = false) {
      const result = String(value == null ? '' : value).trim();
      if (result.length > max || (required && !result) || /[<>]/.test(result)) {
        throw Object.assign(new Error(label + ' 내용을 확인해 주세요.'), { status: 400 });
      }
      return result;
    },
    authenticate: async () => currentUser,
    failure(res, error) {
      return res.status(error.status || 500).json({ error: error.message });
    }
  };
  const portalContent = createPortalContent(http);
  const prisma = {
    academy: { findMany: async () => [{ id: 'acad-1', code: 'A1', name: 'A학원', status: 'ACTIVE', deletedAt: null }] },
    book: {
      findMany: async () => [],
      findUnique: async () => ({ id: 'b1', bookNo: 'B1', title: '도서1', worksheetUrl: '' }),
      findFirst: async () => ({ id: 'b1', bookNo: 'B1', title: '도서1', worksheetUrl: '' })
    },
    bookQuiz: { groupBy: async () => [] },
    member: { findMany: async () => [] },
    portalSetting: { findMany: async () => [] },
    portalFile: { findMany: async () => [] }
  };
  const mod = loadTsModule('api/content.ts', {
    '../lib/prisma': { prisma },
    '../lib/portal-http': http,
    '../lib/portal-content': portalContent
  });
  return mod.default || mod;
}

function makeElement(id) {
  const classes = new Set();
  return {
    id,
    value: '',
    innerText: '',
    innerHTML: '',
    style: {},
    children: [],
    dataset: {},
    classList: {
      add: (...items) => items.forEach(item => classes.add(item)),
      remove: (...items) => items.forEach(item => classes.delete(item)),
      toggle: (item, force) => {
        if (force === undefined ? !classes.has(item) : force) {
          classes.add(item);
          return true;
        }
        classes.delete(item);
        return false;
      },
      contains: item => classes.has(item)
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    querySelector: () => null
  };
}

function loadAstFunctions(context, relPath, names) {
  const source = readPublic(relPath);
  const ast = ts.createSourceFile(relPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  for (const name of names) {
    const matches = ast.statements.filter(item => ts.isFunctionDeclaration(item) && item.name && item.name.text === name);
    assert.equal(matches.length, 1, `${relPath}: ${name} 함수는 정확히 1개여야 합니다 (현재 ${matches.length}개)`);
    vm.runInContext(matches[0].getText(ast), context);
  }
}

test('서버 API: 선생님(TEACHER) 계정은 콘텐츠 공유 폴더·대상 조회 및 회원 변경 요청이 403으로 차단된다', async () => {
  const teacherUser = {
    id: 'teacher-1',
    username: 'tea_1',
    name: '김선생',
    role: 'TEACHER',
    status: 'APPROVED',
    academyId: 'acad-1',
    academy: { id: 'acad-1', code: 'A1', name: 'A학원', status: 'ACTIVE', deletedAt: null }
  };
  const handler = makeContentHandler(teacherUser);

  for (const req of [
    { method: 'GET', query: { action: 'director', username: 'other_dir' } },
    { method: 'GET', query: { action: 'folders' } },
    { method: 'GET', query: { action: 'catalog' } },
    { method: 'POST', query: { action: 'folder' }, body: { operation: 'save', name: '공유폴더' } }
  ]) {
    const res = makeRes();
    await handler(req, res);
    assert.equal(res.statusCode, 403, `${req.method} action=${req.query.action} must return 403 for TEACHER`);
    assert.match(String(res.body && res.body.error), /콘텐츠 공유는 원장/);
  }

  // 학습·콘텐츠 조회용 worksheets 엔드포인트는 선생님도 정상 조회 가능해야 함
  const wsRes = makeRes();
  await handler({ method: 'GET', query: { action: 'worksheets', bookId: 'b1' } }, wsRes);
  assert.equal(wsRes.statusCode, 200);

  // 원장 계정은 catalog/folders 정상 조회 가능
  const directorUser = { ...teacherUser, id: 'dir-1', role: 'DIRECTOR', username: 'dir_1' };
  const dirHandler = makeContentHandler(directorUser);
  for (const action of ['folders', 'catalog']) {
    const res = makeRes();
    await dirHandler({ method: 'GET', query: { action } }, res);
    assert.equal(res.statusCode, 200);
  }
});

test('HTML/SW/테스트 캐시 키 및 teacher 초기 FOUC 차단 CSS·스크립트가 연결되어 있다', () => {
  const adminHtml = readPublic('admin_preview.html');
  const swJs = readPublic('service-worker.js');

  assert.match(adminHtml, /html\.nano-teacher-role\s+#btn-nav-content-sharing/);
  assert.match(adminHtml, /html\.nano-teacher-role\s+#btnOpenStudentAddModal/);
  assert.match(adminHtml, /html\.nano-teacher-role\s+#btnOpenStudentExcelModal/);
  assert.match(adminHtml, /document\.documentElement\.classList\.add\('nano-teacher-role'\)/);
  assert.match(adminHtml, /admin_preview\.js\?v=20261113_init_fix/);
  assert.match(adminHtml, /js\/admin_members\.js\?v=20261113_init_fix/);
  assert.match(adminHtml, /js\/admin_payment\.js\?v=20261113_init_fix/);
  assert.ok(
    adminHtml.indexOf('js/admin_members.js?v=20261113_init_fix') < adminHtml.indexOf('admin_preview.js?v=20261113_init_fix'),
    'admin_members.js는 currentAcademyInfo 전역 정의를 위해 admin_preview.js보다 먼저 로드되어야 합니다'
  );
  assert.match(swJs, /nano-bookshelf-v20261113-init-fix/);
  // #studentDetailModal에 존재하지 않는 m_std_level 요소가 없는지 구조 확인
  assert.doesNotMatch(adminHtml, /id="m_std_level"/);
});

test('admin_preview.js: 선생님 계정은 콘텐츠 공유 탭 이동·복원이 차단되고 관련 메뉴와 등록 버튼이 숨겨진다', () => {
  const elements = {};
  const ids = [
    'btn-nav-content-sharing', 'btn-nav-payment', 'sidebar-section-payment',
    'btn-member-teachers', 'btnOpenClassManageModal', 'btnOpenDeletedStudentsModal',
    'btnModalClassManageWrapper', 'btnOpenStudentAddModal', 'btnOpenStudentExcelModal',
    'headerRoleBadge', 'headerAdminName', 'headerAcademyName',
    'tab-members', 'btn-nav-members', 'tab-content-sharing'
  ];
  for (const id of ids) elements[id] = makeElement(id);
  const docEl = makeElement('html');
  const toasts = [];
  let isTeacher = true;
  let contentRefreshCalls = 0;

  const ctx = vm.createContext({
    document: {
      documentElement: docEl,
      getElementById: id => elements[id] || null,
      querySelector: () => null,
      querySelectorAll: () => []
    },
    window: { location: { hash: '#content-sharing' }, currentAcademyName: '테스트학원', scrollTo: () => {} },
    location: { hash: '#content-sharing' },
    history: { replaceState: (_, __, hash) => { ctx.location.hash = hash; } },
    sessionStorage: {
      _map: new Map([['nano_admin_active_tab', 'content-sharing']]),
      getItem(k) { return this._map.has(k) ? this._map.get(k) : null; },
      setItem(k, v) { this._map.set(k, String(v)); }
    },
    ContentSharing: { refresh: () => { contentRefreshCalls += 1; } },
    showAcademyToast: msg => toasts.push(msg),
    getCurrentAuthUser: () => ({
      id: isTeacher ? 'tea1' : 'dir1',
      name: isTeacher ? '박교사' : '이원장',
      role: isTeacher ? 'TEACHER' : 'DIRECTOR'
    }),
    currentAcademyInfo: { director: '이원장', name: '테스트학원' },
    getCurrentAdminUserName: () => (isTeacher ? '박교사' : '이원장'),
    getCurrentAdminAcademyName: () => '테스트학원',
    isCurrentLoggedInTeacher: () => isTeacher,
    loadTeachersFromStorage: () => [],
    switchMemberSubTab: () => {},
    loadStudentsFromStorage: () => [],
    renderStudentTable: () => {}
  });

  loadAstFunctions(ctx, 'admin_preview.js', ['switchTab', 'updateHeaderUserInfo']);

  ctx.updateHeaderUserInfo();
  assert.equal(elements['btn-nav-content-sharing'].style.display, 'none');
  assert.equal(elements['btnOpenStudentAddModal'].style.display, 'none');
  assert.equal(elements['btnOpenStudentExcelModal'].style.display, 'none');
  assert.equal(elements['btnOpenDeletedStudentsModal'].style.display, 'none');
  assert.equal(elements['btnOpenClassManageModal'].style.display, 'none');
  assert.equal(elements['btn-member-teachers'].style.display, 'none');
  assert.equal(docEl.classList.contains('nano-teacher-role'), true);
  assert.equal(ctx.sessionStorage.getItem('nano_admin_active_tab'), 'members');
  assert.equal(contentRefreshCalls, 0);

  // 직접 switchTab('content-sharing') 호출도 차단되며 안내 토스트를 표시
  toasts.length = 0;
  ctx.switchTab('content-sharing');
  assert.equal(ctx.sessionStorage.getItem('nano_admin_active_tab'), 'members');
  assert.equal(contentRefreshCalls, 0);
  assert.ok(toasts.some(t => t.includes('콘텐츠 공유는 원장님 전용')));

  // 원장 전환 시 메뉴/버튼 복원 확인
  isTeacher = false;
  ctx.updateHeaderUserInfo();
  assert.equal(docEl.classList.contains('nano-teacher-role'), false);
  assert.equal(elements['btn-nav-content-sharing'].style.display, '');
  assert.equal(elements['btnOpenStudentAddModal'].style.display, '');
  assert.equal(elements['btnOpenStudentExcelModal'].style.display, '');
});

test('admin_members.js: 선생님 계정은 모든 회원 생성/수정/삭제 함수가 차단되고 테이블에는 상세 조회만 노출되며 상세 모달이 오류 없이 열린다', async () => {
  const elements = {};
  const ids = [
    'studentTableBody', 'studentSearchInput', 'studentClassFilter', 'studentStatusFilter',
    'studentTotalCount', 'studentPagination',
    'm_std_name', 'm_std_id', 'm_std_school', 'm_std_class',
    'm_std_books', 'm_std_score', 'm_std_phone', 'm_std_teacher', 'm_std_date', 'm_std_memo'
  ];
  for (const id of ids) elements[id] = makeElement(id);
  const toasts = [];
  const alerts = [];
  const shownModals = [];
  let apiCalls = 0;
  let isTeacher = true;

  const ctx = vm.createContext({
    document: {
      getElementById: id => elements[id] || null,
      createElement: () => makeElement('tr')
    },
    window: { NanoPortal: { saveMember: async () => { apiCalls += 1; } } },
    NanoPortal: { saveMember: async () => { apiCalls += 1; } },
    showModalVanilla: id => shownModals.push(id),
    showAcademyToast: msg => toasts.push(msg),
    alert: msg => alerts.push(msg),
    confirm: () => { throw new Error('confirm should not run for teacher'); },
    isCurrentLoggedInTeacher: () => isTeacher,
    getStudentQuizScoreMap: () => new Map(),
    renderMemberStats: () => {},
    getFilteredStudentList: () => ctx.studentDataList,
    studentDataList: [
      {
        id: 'std1',
        name: '박진호',
        gender: 'M',
        school: '나노초',
        grade: '초4',
        classGroup: 'A Class',
        status: 'ACTIVE',
        phone: '010-1234-5678',
        parentName: '김학부모',
        createDate: '2026-11-01',
        lastDate: '2026-11-12',
        bookCount: 4,
        quizAvg: 88,
        teacher: '박교사',
        memo: '성실함'
      }
    ],
    deletedStudentList: [{ id: 'del1', name: '삭제생' }],
    teacherDataList: [{ id: 'tea1', name: '박교사', username: 'tea1', phone: '010-0000-0000' }],
    currentStudentPage: 1,
    studentsPerPage: 15,
    studentPageSize: 20,
    studentCurrentPage: 1,
    currentFilteredStudents: [],
    renderStudentPagination: () => {},
    formatAccountDate: d => String(d || '-'),
    lastAddedStudentId: null
  });

  loadAstFunctions(ctx, 'js/admin_members.js', [
    'isTeacherMemberReadOnly',
    'guardTeacherMemberMutation',
    'deleteStudent',
    'confirmDeleteStudent',
    'openDeletedStudentListModal',
    'restoreDeletedStudent',
    'openStudentAddModal',
    'openStudentEditModal',
    'openStudentExcelModal',
    'saveNewStudent',
    'importSampleExcelStudents',
    'handleStudentExcelFileSelect',
    'openTeacherAddModal',
    'openTeacherEditModal',
    'handleSaveTeacher',
    'deleteTeacher',
    'renderStudentTable',
    'openStudentDetailModal'
  ]);

  // 1) 모든 생성·수정·삭제 함수 차단 검증
  const fileInput = { files: [{ name: 'test.xlsx', size: 100 }], value: 'C:\\fakepath\\test.xlsx' };
  let prevented = false;
  await ctx.deleteStudent('std1');
  await ctx.confirmDeleteStudent();
  ctx.openDeletedStudentListModal();
  await ctx.restoreDeletedStudent(0);
  ctx.openStudentAddModal();
  ctx.openStudentEditModal('std1');
  ctx.openStudentExcelModal();
  await ctx.saveNewStudent();
  await ctx.importSampleExcelStudents();
  ctx.handleStudentExcelFileSelect(fileInput);
  ctx.openTeacherAddModal();
  ctx.openTeacherEditModal('tea1');
  await ctx.handleSaveTeacher({ preventDefault: () => { prevented = true; } });
  await ctx.deleteTeacher('tea1');

  assert.equal(prevented, true);
  assert.equal(fileInput.value, '');
  assert.equal(apiCalls, 0);
  assert.equal(shownModals.length, 0);
  assert.equal(toasts.length, 14);
  assert.equal(alerts.length, 0);

  // 2) 선생님 테이블 렌더링: 수정/삭제 없음 + 상세 버튼/링크 노출
  ctx.renderStudentTable();
  const teacherRowHtml = elements['studentTableBody'].children.map(r => r.innerHTML).join('');
  assert.match(teacherRowHtml, /openStudentDetailModal\('std1'\)/);
  assert.match(teacherRowHtml, /상세/);
  assert.doesNotMatch(teacherRowHtml, /openStudentEditModal/);
  assert.doesNotMatch(teacherRowHtml, /deleteStudent/);

  // 3) m_std_level DOM 요소가 없어도 상세 모달이 정상 오픈되어야 함
  ctx.openStudentDetailModal('std1');
  assert.deepEqual(shownModals, ['studentDetailModal']);
  assert.equal(elements['m_std_name'].innerText, '박진호');
  assert.equal(elements['m_std_school'].innerText, '나노초 (초4)');
  assert.equal(elements['m_std_books'].innerText, '4권 완독');
  assert.equal(elements['m_std_score'].innerText, '88점');

  // 4) 원생 목록이 비어 있을 때 선생님에게는 등록 유도 안내가 숨겨짐
  const savedStudents = ctx.studentDataList;
  ctx.studentDataList = [];
  ctx.renderStudentTable();
  const emptyTeacherHtml = elements['studentTableBody'].innerHTML;
  assert.doesNotMatch(emptyTeacherHtml, /\[\+ 원생 등록\]/);
  assert.match(emptyTeacherHtml, /원장님 계정에서 원생을 등록/);

  // 5) 원장 전환 시 테이블에 수정/삭제 버튼 정상 노출
  isTeacher = false;
  ctx.studentDataList = savedStudents;
  elements['studentTableBody'].children = [];
  ctx.renderStudentTable();
  const directorRowHtml = elements['studentTableBody'].children.map(r => r.innerHTML).join('');
  assert.match(directorRowHtml, /openStudentEditModal\('std1'\)/);
  assert.match(directorRowHtml, /deleteStudent\('std1'\)/);
});

test('admin_preview.html: 운영 서버(NANO_SERVER_DATA=true + 비어있지 않은 카톡 발송 로그) 초기 부팅 시 원장/선생님 계정 모두 오류와 AI 무한루프 없이 원생 목록과 권한이 적용된다', async () => {
  const adminHtml = readPublic('admin_preview.html');
  const idSet = new Set([...adminHtml.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]));

  async function runBootScenario(authUser) {
    const listeners = { DOMContentLoaded: [], hashchange: [], load: [], pageshow: [], visibilitychange: [], ready: [] };

    function makeBootStyle() {
      const store = {};
      return new Proxy(store, {
        get(t, k) {
          if (k === 'setProperty') return (p, v) => { t[p] = v; };
          if (k === 'removeProperty') return p => { delete t[p]; };
          if (k === 'getPropertyValue') return p => t[p] || '';
          return t[k] || '';
        },
        set(t, k, v) { t[k] = v; return true; }
      });
    }

    const elMap = {};
    function makeBootEl(tag, id) {
      const classes = new Set();
      const children = [];
      let innerHtml = '';
      return {
        tagName: (tag || 'DIV').toUpperCase(),
        id: id || '',
        value: '',
        innerText: '',
        textContent: '',
        get innerHTML() { return innerHtml; },
        set innerHTML(v) { innerHtml = String(v == null ? '' : v); if (!innerHtml) children.length = 0; },
        style: makeBootStyle(),
        dataset: {},
        className: '',
        children,
        options: [],
        selectedIndex: 0,
        disabled: false,
        checked: false,
        classList: {
          add: (...a) => a.forEach(x => classes.add(x)),
          remove: (...a) => a.forEach(x => classes.delete(x)),
          toggle: (x, f) => ((f === undefined ? !classes.has(x) : f) ? (classes.add(x), true) : (classes.delete(x), false)),
          contains: x => classes.has(x)
        },
        setAttribute() {},
        getAttribute() { return null; },
        removeAttribute() {},
        addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
        removeEventListener() {},
        appendChild(c) { children.push(c); return c; },
        prepend(c) { children.unshift(c); return c; },
        insertBefore(c) { children.push(c); return c; },
        insertAdjacentElement() {},
        remove() {},
        closest() { return null; },
        querySelector(sel) {
          if (sel && sel.startsWith('#')) {
            const key = sel.slice(1).split(/[ .:\[]/)[0];
            return elMap[key] || makeBootEl('div', key);
          }
          return makeBootEl('div', '');
        },
        querySelectorAll() { return []; },
        focus() {},
        select() {},
        click() {}
      };
    }

    for (const id of idSet) elMap[id] = makeBootEl('div', id);

    const storageObj = () => {
      const m = new Map();
      return {
        get length() { return m.size; },
        key: i => Array.from(m.keys())[i] || null,
        getItem: k => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => m.set(k, String(v)),
        removeItem: k => m.delete(k),
        clear: () => m.clear()
      };
    };
    const sess = storageObj();
    sess.setItem('nano_auth_user', JSON.stringify(authUser));

    const docEl = makeBootEl('html', '');
    const doc = {
      readyState: 'loading',
      documentElement: docEl,
      head: makeBootEl('head', ''),
      body: makeBootEl('body', ''),
      cookie: '',
      visibilityState: 'visible',
      getElementById: id => elMap[id] || null,
      createElement: tag => makeBootEl(tag, ''),
      createTextNode: t => ({ textContent: t }),
      querySelector: sel => docEl.querySelector(sel),
      querySelectorAll: () => [],
      addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
      removeEventListener: () => {}
    };

    const jqFn = function(sel) {
      const arr = [];
      arr.on = () => arr; arr.off = () => arr; arr.modal = () => arr;
      arr.val = () => ''; arr.text = () => arr; arr.html = () => arr;
      arr.show = () => arr; arr.hide = () => arr; arr.find = () => arr;
      arr.length = sel ? 1 : 0;
      return arr;
    };
    jqFn.fn = {};

    const fetchUrls = [];
    const win = {
      document: doc,
      location: { protocol: 'https:', hostname: 'www.nanosbook.co.kr', pathname: '/admin_preview.html', href: 'https://www.nanosbook.co.kr/admin_preview.html', hash: '', search: '', replace() {} },
      history: { replaceState() {}, pushState() {} },
      localStorage: storageObj(),
      sessionStorage: sess,
      navigator: { userAgent: 'node-test' },
      addEventListener: (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); },
      dispatchEvent: () => {},
      Event: function(n) { this.type = n; },
      scrollTo: () => {},
      matchMedia: () => ({ matches: false }),
      AbortController, AbortSignal, URL, URLSearchParams,
      fetch: async (url) => {
        const u = String(url);
        fetchUrls.push(u);
        assert.ok(fetchUrls.length <= 25, `초기 부팅 중 과도한 fetch 루프 감지: ${fetchUrls.join(', ')}`);
        const items = u.includes('dispatch_stats')
          ? [{ id: 'AL-1', academyId: 'ACAD-143', type: '북퀴즈 완료 알림톡', receiverName: '김태환', receiverPhone: '010-1234-5678', status: 'ACCEPTED', date: '2026-11-13 15:00' }]
          : [];
        return {
          ok: true,
          status: 200,
          json: async () => ({ user: authUser, items, logs: [], rankings: [], months: [] }),
          text: async () => '{}'
        };
      },
      $: jqFn, jQuery: jqFn,
      alert: () => {}, confirm: () => true,
      setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
      console,
      NANO_SERVER_DATA: true,
      NANO_BOOTSTRAP_MEMBER_ID: authUser.id,
      MIGRATED_FRANCHISES: [{ serverId: 'ac-1', id: 'ACAD-143', name: '주식회사 루크러닝', director: '이정민', adminId: 'lookadmin', maxStudents: 100, status: 'ACTIVE', plan: 'Standard', startDate: '2026-01-01', endDate: '2026-12-31', joinDate: '2026-01-01' }],
      MIGRATED_MEMBERS: [
        { id: 1, serverId: 'm-std1', username: 'pjh1', name: '박진호', role: 'STUDENT', status: 'APPROVED', academyId: 'ACAD-143', academyName: '주식회사 루크러닝', classGroupId: 'c1', className: 'A Class', school: '나노초', grade: '초4', bookCount: 4, quizAvg: 85, points: 83, createdAt: '2026-11-01', updatedAt: '2026-11-12T00:00:00Z' },
        { id: 2, serverId: 'm-tea1', username: 'tea1', name: '김선생', role: 'TEACHER', status: 'APPROVED', academyId: 'ACAD-143', academyName: '주식회사 루크러닝', phone: '010-0000-0000', createdAt: '2026-11-01', updatedAt: '2026-11-12T00:00:00Z' }
      ],
      NANO_SERVER_CLASSES: [{ id: 'c1', serverId: 'c1', academyId: 'ACAD-143', name: 'A Class', grade: '초등 4학년', teacher: '김선생' }],
      MIGRATED_BOOKS: [{ id: '1001', bookNo: 'KB1001', title: '긴긴밤', author: '루리', publisher: '문학동네', grade: '초등 4학년', quizSets: [], hasSheet: false }],
      MIGRATED_RANKINGS: [], MIGRATED_ACADEMY_RANKINGS: [],
      NANO_SERVER_DISPATCH: [{ id: 'AL-1', academyId: 'ACAD-143', type: '북퀴즈 완료 알림톡', receiverName: '김태환', receiverPhone: '010-1234-5678', status: 'ACCEPTED', date: '2026-11-13 15:00' }],
      NANO_SERVER_PAYMENTS: [{ id: 'PAY-1', academyId: 'ACAD-143', amount: 100000, status: 'PAID' }],
      NANO_SERVER_OWNED: [], NANO_SERVER_NOTICES: [], NANO_SERVER_PORTFOLIOS: [], NANO_SERVER_RECOMMENDED: []
    };
    win.window = win; win.globalThis = win; win.self = win;
    const ctx = vm.createContext(win);

    const tagRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let m, idx = 0;
    while ((m = tagRe.exec(adminHtml)) !== null) {
      const srcM = m[1].match(/\bsrc=["']([^"'?]+)/i);
      if (srcM) {
        const src = srcM[1];
        if (src.startsWith('http') || src.startsWith('//') || src.startsWith('migrated_real_data')) continue;
        vm.runInContext(readPublic(src), ctx, { filename: src });
      } else if (m[2].trim()) {
        vm.runInContext(m[2], ctx, { filename: 'inline_' + (idx++) });
      }
    }

    doc.readyState = 'complete';
    for (const fn of listeners.DOMContentLoaded) {
      fn();
    }
    await new Promise(resolve => setImmediate(resolve));
    return { ctx, elMap, docEl, fetchUrls };
  }

  const adminBoot = await runBootScenario({
    id: 'lookadmin', username: 'lookadmin', name: '이정민 원장', role: 'admin',
    academyId: 'ACAD-143', academyName: '주식회사 루크러닝', server: true
  });
  assert.equal(adminBoot.ctx.assignmentLoadError, false);
  assert.equal(adminBoot.ctx.academyDispatchLogs.length, 1);
  assert.equal(adminBoot.elMap['tabStudentCount'].innerText, 1);
  assert.equal(adminBoot.elMap['tabTeacherCount'].innerText, 1);
  assert.equal(adminBoot.elMap['studentTableBody'].children.length, 1);
  assert.match(adminBoot.elMap['studentTableBody'].children[0].innerHTML, /박진호/);
  assert.equal(adminBoot.fetchUrls.some(u => u.includes('/api/portfolio-ai')), false);

  const teacherBoot = await runBootScenario({
    id: 'tea1', username: 'tea1', name: '김선생', role: 'teacher',
    academyId: 'ACAD-143', academyName: '주식회사 루크러닝', server: true
  });
  assert.equal(teacherBoot.docEl.classList.contains('nano-teacher-role'), true);
  assert.equal(teacherBoot.elMap['btn-nav-content-sharing'].style.display, 'none');
  assert.equal(teacherBoot.elMap['studentTableBody'].children.length, 1);
  const teacherRowHtml = teacherBoot.elMap['studentTableBody'].children[0].innerHTML;
  assert.match(teacherRowHtml, /박진호/);
  assert.doesNotMatch(teacherRowHtml, /openStudentEditModal/);
  assert.doesNotMatch(teacherRowHtml, /deleteStudent/);
  assert.equal(teacherBoot.fetchUrls.some(u => u.includes('/api/portfolio-ai')), false);
});


