const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
      { id: 'b-acad-code', bookNo: 'AC001', title: 'A학원 도서', author: '작가2', publisher: '출판2', grade: '초등 5학년', coverUrl: '/c2.png', worksheetUrl: 'https://r2.example.com/ac.pdf' },
      { id: 'b-acad-quiz', bookNo: 'AC002', title: 'A학원 퀴즈 도서', author: '작가3', publisher: '출판3', grade: '초등 6학년', coverUrl: '', worksheetUrl: '' }
    ],
    quizGroups: [
      { bookId: 'b-hq', legacyQuizSeq: 1, _count: { id: 5 } },
      { bookId: 'b-acad-quiz', legacyQuizSeq: -12345, _count: { id: 4 } }
    ],
    settings: [
      { key: 'book_creator:AC001', scope: 'book_creator', revision: 1, value: { academyCode: 'ACAD-A', academyName: 'A학원' } },
      { key: 'quiz_seq:-12345', scope: 'quiz_author_seq', revision: 1, value: { academyId: 'acad-a', academyName: 'A학원', authorType: 'ACADEMY' } }
    ],
    currentUser: null
  };
  const handler = makeContentHandler(state);

  // 마스터 카탈로그: 본사 도서(b-hq)만 포함, A학원 도서/퀴즈(b-acad-code, b-acad-quiz)는 제외
  state.currentUser = state.members[0];
  let res = makeRes();
  await handler({ method: 'GET', query: { action: 'catalog' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.items.map(i => i.id), ['b-hq']);
  assert.equal(res.body.items[0].quizCount, 5);
  assert.equal(res.body.items[0].hasSheet, true);

  // A학원 원장 카탈로그: academyCode만 저장된 레거시 시트 도서(b-acad-code)와 퀴즈 도서(b-acad-quiz) 모두 포함
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

test('마스터 페이지와 콘텐츠 공유 프런트엔드 파일에 필수 메뉴, 뷰, ID 조회 UI 및 최신 스크립트 캐시 키가 연결되어 있다', () => {
  const masterHtml = fs.readFileSync(path.join(__dirname, '../public_html/master_preview.html'), 'utf8');
  const masterCore = fs.readFileSync(path.join(__dirname, '../public_html/js/master/master-core.js'), 'utf8');
  const sharingJs = fs.readFileSync(path.join(__dirname, '../public_html/js/content-sharing.js'), 'utf8');

  assert.match(masterHtml, /id="nav-master-content-sharing"/);
  assert.match(masterHtml, /id="tab-master-content-sharing"/);
  assert.match(masterHtml, /id="view-content-sharing"/);
  assert.doesNotMatch(masterHtml, /master-core\.js\?v=20261112_pf_v2/);
  assert.match(masterHtml, /master-core\.js\?v=20261113_sharing_fix/);
  assert.match(masterCore, /'content-sharing'/);
  assert.match(masterCore, /ContentSharing\.refresh\(\)/);
  assert.match(sharingJs, /action=director&username=/);
  assert.match(sharingJs, /id="sharingDirectorLookupBtn"/);
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
    settings: [],
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
  assert.equal(state.settings[0].value.ownerAcademyName, '본사');
});

