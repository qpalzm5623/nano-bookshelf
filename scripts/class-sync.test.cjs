const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function readPublic(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', 'public_html', relPath), 'utf8');
}

function loadTs(file, modules = {}) {
  if (/^api\/(portal|bootstrap|manage)\.ts$/.test(file)) {
    modules = {
      '../lib/portal-content': require('./test-portal-content.cjs')(modules['../lib/portal-http']),
      ...modules
    };
  }
  const brand = require('./test-portal-brand.cjs')((modules['../lib/prisma'] || modules['./prisma'] || {}).prisma);
  modules = { '../lib/portal-brand': brand, './portal-brand': brand, ...modules };
  const exports = {};
  const fullPath = path.join(__dirname, '..', file);
  const code = ts.transpileModule(fs.readFileSync(fullPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    require: name => modules[name] || require(name.startsWith('.') ? path.resolve(path.dirname(fullPath), name) : name),
    Buffer,
    process,
    console,
    URL,
    Date
  });
  return exports;
}

function createStorage() {
  const store = new Map();
  return {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
}

function createPortalEnv() {
  const fetchCalls = [];
  const storage = createStorage();
  storage.setItem('nano_auth_user', JSON.stringify({ id: 'lookadmin', role: 'admin', academyId: 'ACAD-143', academyName: '주식회사 루크러닝', server: true }));
  let nextClassSeq = 3;
  const serverClasses = [
    { id: 'c1', serverId: 'c1', academyId: 'ACAD-143', name: 'A Class', targetGrade: '초등 4학년', teacher: '김선생' },
    { id: 'c2', serverId: 'c2', academyId: 'ACAD-143', name: 'B Class', targetGrade: '초등 5학년', teacher: '박선생' }
  ];

  const win = {
    location: { protocol: 'https:', hostname: 'nanosbook.co.kr', pathname: '/admin_preview.html', replace() {}, href: '' },
    document: { readyState: 'loading', documentElement: { style: {} }, addEventListener() {}, querySelector: () => null },
    addEventListener() {},
    fetch: async (url, opts) => {
      const body = opts && opts.body ? JSON.parse(opts.body) : null;
      fetchCalls.push({ url, body });
      if (url.includes('entity=classes') && body && body.operation === 'save') {
        const clsId = body.data.id || ('c' + (nextClassSeq++));
        const item = { id: clsId, name: body.data.name, targetGrade: body.data.targetGrade || '', teacher: body.data.teacher || '' };
        return { ok: true, status: 200, json: async () => ({ item }) };
      }
      if (url.includes('entity=classes') && body && body.operation === 'delete') {
        return { ok: true, status: 200, json: async () => ({ ok: true }) };
      }
      if (url.includes('entity=members') && body && body.operation === 'save') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [{
              id: body.data.id || 'm-new',
              classGroupId: body.data.classGroupId || null,
              updatedAt: '2026-11-23T02:40:00.000Z'
            }]
          })
        };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    },
    sessionStorage: storage,
    localStorage: storage,
    AbortSignal: { timeout: () => undefined },
    NANO_SERVER_DATA: true,
    NANO_SERVER_CLASSES: serverClasses.map(c => ({ ...c })),
    currentAcademyInfo: { id: 'ACAD-143', name: '주식회사 루크러닝' },
    console, URL, URLSearchParams, Date, Map, Set, Array, Object, String, Number, Boolean, Promise, RegExp, Math, JSON, Error,
    setTimeout, clearTimeout, setInterval, clearInterval, Event: function(n) { this.type = n; }
  };
  win.window = win;
  win.globalThis = win;
  vm.runInNewContext(readPublic('js/portal-client.js'), win);
  return { win, fetchCalls, storage };
}

test('portal-client는 기존 학급 ID가 있어도 변경된 학급명(및 미지정)에 맞는 classGroupId를 전송하고 신규 개설 학급도 즉시 동기화한다', async () => {
  const { win, fetchCalls } = createPortalEnv();
  const student = {
    id: 'look1',
    serverId: 'm-look1',
    username: 'look1',
    name: '박진호',
    role: 'STUDENT',
    status: '승인',
    classGroup: 'B Class',
    classGroupId: 'c1', // 이전 학급(A Class)의 stale classGroupId 보유 상태
    updatedAt: '2026-11-23T01:00:00.000Z'
  };

  await win.NanoPortal.saveMember(student, 'ACAD-143');
  let lastMemberCall = fetchCalls.filter(c => c.url.includes('entity=members')).pop();
  assert.equal(lastMemberCall.body.data.classGroupId, 'c2', '변경된 학급 B Class의 ID(c2)가 전송되어야 합니다');
  assert.equal(student.classGroupId, 'c2');

  // 미지정으로 변경 시 이전 c2를 유지하지 않고 null로 전송해야 함
  student.classGroup = '미지정';
  await win.NanoPortal.saveMember(student, 'ACAD-143');
  lastMemberCall = fetchCalls.filter(c => c.url.includes('entity=members')).pop();
  assert.equal(lastMemberCall.body.data.classGroupId, null, '미지정 선택 시 classGroupId가 null이어야 합니다');
  assert.equal(student.classGroupId, null);

  // 같은 세션에서 새 학급 개설 후 바로 학생 배정
  const newCls = { id: 'CLS999', name: 'C Class', grade: '초등 6학년', teacher: '최선생' };
  await win.NanoPortal.saveClass(newCls, 'ACAD-143');
  assert.ok(win.NANO_SERVER_CLASSES.some(c => c.name === 'C Class' && (c.serverId || c.id) === 'c3'));

  student.classGroup = 'C Class';
  await win.NanoPortal.saveMember(student, 'ACAD-143');
  lastMemberCall = fetchCalls.filter(c => c.url.includes('entity=members')).pop();
  assert.equal(lastMemberCall.body.data.classGroupId, 'c3');

  // 학급 삭제 시 NANO_SERVER_CLASSES에서도 제거
  await win.NanoPortal.deleteClass(newCls, 'ACAD-143');
  assert.ok(!win.NANO_SERVER_CLASSES.some(c => (c.serverId || c.id) === 'c3'));
});

test('api/manage는 classGroupId 미전달 시 className으로 학급 ID를 보완 해석하고 null(미지정) 저장을 허용한다', async () => {
  const existingMember = {
    id: 'm-look1', academyId: 'acad-143', username: 'look1', name: '박진호',
    role: 'STUDENT', status: 'APPROVED', classGroupId: 'c1', updatedAt: new Date('2026-11-23T01:00:00.000Z')
  };
  let savedData = null;
  const db = {
    $transaction: async fn => fn({
      $queryRaw: async () => [],
      classGroup: {
        findFirst: async ({ where }) => {
          if (where.id === 'c2' && where.academyId === 'acad-143') return { id: 'c2', name: 'B Class' };
          if (where.name === 'C Class' && where.academyId === 'acad-143') return { id: 'c3', name: 'C Class' };
          return null;
        }
      },
      member: {
        findFirst: async () => existingMember,
        update: async ({ data }) => {
          savedData = data;
          return { ...existingMember, ...data, updatedAt: new Date('2026-11-23T02:00:00.000Z') };
        }
      }
    })
  };
  const http = loadTs('lib/portal-http.ts', { './prisma': { prisma: db }, './portal-auth': {} });
  const handler = loadTs('api/manage.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': {
      ...http,
      authenticate: async () => ({ id: 'dir-1', role: 'DIRECTOR', academyId: 'acad-143', academy: { id: 'acad-143', code: 'ACAD-143' } }),
      academyScope: async () => 'acad-143'
    },
    '../lib/portal-auth': { hashPassword: () => '$hash' },
    '../lib/portal-learning': loadTs('lib/portal-learning.ts')
  }).default;

  // 1) classGroupId null + className 'C Class' -> c3 자동 연결
  const res1 = { code: 200, setHeader() {}, status(c) { this.code = c; return this; }, json(d) { this.data = d; return this; } };
  await handler({
    method: 'POST', query: { entity: 'members' },
    body: { operation: 'save', data: { id: 'm-look1', username: 'look1', name: '박진호', role: 'STUDENT', status: 'APPROVED', classGroupId: null, className: 'C Class' } }
  }, res1);
  assert.equal(res1.code, 200);
  assert.equal(savedData.classGroupId, 'c3');

  // 2) 미지정(classGroupId: null, className 생략) -> null 반영
  const res2 = { code: 200, setHeader() {}, status(c) { this.code = c; return this; }, json(d) { this.data = d; return this; } };
  await handler({
    method: 'POST', query: { entity: 'members' },
    body: { operation: 'save', data: { id: 'm-look1', username: 'look1', name: '박진호', role: 'STUDENT', status: 'APPROVED', classGroupId: null } }
  }, res2);
  assert.equal(res2.code, 200);
  assert.equal(savedData.classGroupId, null);
});

test('admin_members는 서버 모드에서 stale localStorage보다 DB 데이터를 우선하고 원생 학급 수정 시 올바른 classGroupId로 저장한다', async () => {
  const storage = createStorage();
  // 오래된 로컬 캐시 시뮬레이션 (이전 학급 A Class가 localStorage에 남아 있는 상태)
  storage.setItem('NANO_CLASSES_ACAD-143', JSON.stringify([{ id: 'CLS01', name: 'Old Local Class' }]));
  storage.setItem('NANO_ACADEMY_STUDENTS_ACAD-143', JSON.stringify([{ id: 'look1', username: 'look1', name: '박진호', classGroup: 'Old Local Class' }]));
  storage.setItem('nano_auth_user', JSON.stringify({ id: 'lookadmin', role: 'admin', academyId: 'ACAD-143', academyName: '주식회사 루크러닝', server: true }));

  const elements = {};
  const makeEl = (id, initVal = '') => {
    const el = {
      id, value: initVal, innerHTML: '', innerText: '', readOnly: false, checked: true, options: [], children: [],
      appendChild(opt) { this.options.push(opt); this.children.push(opt); },
      focus() {},
      classList: { add() {}, remove() {} },
      style: {}
    };
    Object.defineProperty(el, 'innerHTML', {
      get() { return el._html || ''; },
      set(v) { el._html = String(v); if (v === '') { el.options = []; el.children = []; } }
    });
    elements[id] = el;
    return el;
  };
  ['editStudentTargetId', 'newStdName', 'newStdGender', 'newStdId', 'newStdPw', 'newStdSchool', 'newStdGrade', 'newStdClass',
   'newStdStatus', 'newStdLevel', 'newStdParentName', 'newStdParentPhone', 'newStdParentEmail', 'newStdReportYn', 'newStdTeacher',
   'newStdMemo', 'newStdJoinDate', 'studentTableBody', 'filterStudentClass', 'learningClassFilter', 'filterAssignStudentClass'].forEach(id => makeEl(id));
  elements.newStdReportYn.checked = true;

  let savedPayloadSent = null;
  const serverClasses = [
    { id: 'c1', serverId: 'c1', academyId: 'ACAD-143', name: 'A Class', grade: '초등 4학년', teacher: '김선생' },
    { id: 'c2', serverId: 'c2', academyId: 'ACAD-143', name: 'B Class', grade: '초등 5학년', teacher: '박선생' }
  ];
  const migratedMembers = [
    {
      username: 'look1', serverId: 'm-look1', name: '박진호', role: 'STUDENT', status: 'APPROVED',
      academyId: 'ACAD-143', academyName: '주식회사 루크러닝',
      classGroupId: 'c1', className: 'A Class', grade: '초등 4학년', school: '옥천초등학교',
      updatedAt: '2026-11-23T01:00:00.000Z'
    }
  ];

  const ctx = {
    window: null,
    document: {
      getElementById: id => elements[id] || null,
      createElement: tag => makeEl('dyn_' + tag + '_' + Math.random()),
      querySelectorAll: () => [],
      addEventListener() {}
    },
    localStorage: storage,
    sessionStorage: storage,
    NANO_SERVER_DATA: true,
    NANO_SERVER_CLASSES: serverClasses,
    MIGRATED_MEMBERS: migratedMembers,
    MIGRATED_FRANCHISES: [{ id: 'ACAD-143', name: '주식회사 루크러닝', adminId: 'lookadmin', maxStudents: 100 }],
    NanoPreviewData: {
      belongsToAcademy: (m, acad) => m.academyId === acad.id,
      readAssignments: () => ({ students: [], classes: [] })
    },
    NanoPortal: {
      remote: true,
      saveMember: async item => {
        const classMatch = serverClasses.find(c => c.name === item.classGroup);
        savedPayloadSent = { classGroup: item.classGroup, classGroupId: item.classGroupId, resolvedId: classMatch ? classMatch.id : null };
        return { id: item.serverId, classGroupId: item.classGroupId, updatedAt: '2026-11-23T03:00:00.000Z' };
      }
    },
    alert: msg => { throw new Error('unexpected alert: ' + msg); },
    confirm: () => true,
    isCurrentLoggedInTeacher: () => false,
    guardTeacherMemberMutation: () => false,
    isTeacherMemberReadOnly: () => false,
    initPortfolioOptions() {},
    showAcademyToast() {},
    updateClassSelectOptions: undefined,
    filterStudents() {},
    renderStudentTable() {},
    renderTeacherTable() {},
    renderClassManageTable() {},
    updateAllStudentCounts() {},
    hideModalVanilla() {},
    showModalVanilla() {},
    setTimeout, clearTimeout, console, Array, Object, String, Number, Date, JSON, Math, Set, Promise
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;

  vm.runInNewContext(readPublic('js/admin_members.js'), ctx);

  // 1) 서버 모드에서는 stale localStorage가 아닌 서버 데이터가 우선 반영되어야 함
  assert.equal(ctx.academyClassList.some(c => c.name === 'B Class'), true);
  assert.equal(ctx.academyClassList.some(c => c.name === 'Old Local Class'), false);
  assert.equal(ctx.studentDataList[0].classGroup, 'A Class');

  // 2) 원생 수정 모달 오픈 후 학년만 바뀌어도 기존 학급이 비워지지 않아야 함
  ctx.openStudentEditModal('look1');
  assert.equal(elements.newStdClass.value, 'A Class');
  ctx.onStudentGradeChange('초등 5학년');
  assert.equal(elements.newStdClass.value, 'A Class');

  // 3) 학급을 B Class로 변경 후 저장 시 classGroupId도 c2로 갱신되어 저장됨
  elements.newStdClass.value = 'B Class';
  await ctx.saveNewStudent();
  assert.equal(savedPayloadSent.classGroup, 'B Class');
  assert.equal(savedPayloadSent.classGroupId, 'c2');
  assert.equal(ctx.studentDataList[0].classGroupId, 'c2');
  assert.equal(migratedMembers[0].className, 'B Class');
  assert.equal(migratedMembers[0].classGroupId, 'c2');

  // 4) 학급을 미지정으로 변경 후 저장 시 이전 classGroupId(c2)가 제거되어야 함
  ctx.openStudentEditModal('look1');
  elements.newStdClass.value = '미지정';
  await ctx.saveNewStudent();
  assert.equal(savedPayloadSent.classGroup, '미지정');
  assert.equal(savedPayloadSent.classGroupId, null);
  assert.equal(ctx.studentDataList[0].classGroupId, null);
  assert.equal(migratedMembers[0].className, '미지정');
  assert.equal(migratedMembers[0].classGroupId, null);
});

test('master-members는 학원의 NANO_SERVER_CLASSES를 표시하고 회원 학급 수정 시 classGroupId를 함께 갱신한다', async () => {
  const els = {};
  const makeEl = (id, val = '') => {
    const o = { id, value: val, innerHTML: '', innerText: '', checked: true, classList: { add() {}, remove() {} } };
    els[id] = o;
    return o;
  };
  ['detailMemberId', 'detailMemberNameInput', 'detailMemberGender', 'detailMemberPw', 'detailMemberSchool',
   'detailMemberGrade', 'detailMemberClass', 'detailMemberStatus', 'detailMemberParentName',
   'detailMemberParentPhone', 'detailMemberParentEmail', 'detailMemberReportYn', 'detailMemberPhone', 'detailMemberMemo',
   'detailMemberName', 'detailMemberAcademy', 'detailMemberUsername', 'detailMemberRoleBadge',
   'detailMemberRoleDisplay', 'detailMemberPoints', 'detailMemberJoinDate', 'btnToggleMemberStatus',
   'memberStatusChangeConfirmBox', 'memberStatusAcademyConfirm'].forEach(id => makeEl(id));

  let masterSent = null;
  const memRow = {
    id: 1, serverId: 'm-look1', username: 'look1', name: '박진호', role: 'STUDENT',
    academyId: 'ACAD-143', academyName: '주식회사 루크러닝', classGroupId: 'c1', className: 'A Class',
    status: 'APPROVED', grade: '초5', school: '옥천초등학교', updatedAt: '2026-11-23T01:00:00.000Z'
  };
  const mCtx = {
    window: null,
    document: { getElementById: id => els[id] || null, addEventListener() {}, querySelectorAll: () => [] },
    localStorage: createStorage(),
    sessionStorage: createStorage(),
    $: () => ({ modal() {} }),
    NANO_SERVER_CLASSES: [
      { id: 'c1', serverId: 'c1', academyId: 'ACAD-143', name: 'A Class' },
      { id: 'c2', serverId: 'c2', academyId: 'ACAD-143', name: 'B Class' }
    ],
    MIGRATED_MEMBERS: [memRow],
    memberList: [{ ...memRow }],
    franchiseList: [{ id: 'ACAD-143', name: '주식회사 루크러닝' }],
    NanoPortal: {
      remote: true,
      saveMember: async item => {
        masterSent = { className: item.className, classGroupId: item.classGroupId };
        return { id: item.serverId, classGroupId: item.classGroupId, updatedAt: '2026-11-23T04:00:00.000Z' };
      }
    },
    saveMembersToStorage() {},
    renderMemberTable() {},
    showMasterToast() {},
    console, Array, Object, String, Number, Date, JSON, Set, Promise
  };
  mCtx.window = mCtx;
  mCtx.globalThis = mCtx;
  vm.runInNewContext(readPublic('js/master/master-members.js'), mCtx);

  mCtx.openMemberDetailModal(1);
  assert.ok(els.detailMemberClass.innerHTML.includes('B Class'));
  els.detailMemberClass.value = 'B Class';
  await mCtx.saveMemberDetailEdit();
  assert.equal(masterSent.className, 'B Class');
  assert.equal(masterSent.classGroupId, 'c2');
  assert.equal(mCtx.memberList[0].classGroupId, 'c2');
  assert.equal(memRow.className, 'B Class');
  assert.equal(memRow.classGroupId, 'c2');
});
