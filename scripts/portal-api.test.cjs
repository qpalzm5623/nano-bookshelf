const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
process.env.PORTAL_AUTH_SECRET = 'test-only-secret-with-more-than-32-characters';
process.env.DATABASE_URL = 'postgresql://test.invalid/test';
function load(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => dependencies[name] || require(name), Buffer, process, console, URL, Date });
  return exports;
}
const auth = load('lib/portal-auth.ts');
const hash = auth.hashPassword('correct-password-for-tests');
function member(role = 'STUDENT') {
  return { id: 'member-a', username: 'student-a', name: '검증 학생', role, status: 'APPROVED', password: hash,
    academyId: 'academy-a', academy: { code: 'A', name: '검증 학원', status: 'ACTIVE', deletedAt: null }, classGroup: { name: '검증반' } };
}
function request(action, body, token) {
  return { query: { action }, method: body === undefined ? 'GET' : 'POST', body,
    headers: { origin: 'https://test.example', host: 'test.example', 'content-type': 'application/json', cookie: token ? 'nano_portal=' + token : '' } };
}
function response() {
  return { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(value) { this.data = value; return this; } };
}
function handler(user, extra = {}) {
  const db = { member: { findUnique: async () => user, update: async () => user }, portalFile: {findMany: async()=>[]}, ...extra };
  const http = load('lib/portal-http.ts', {'./prisma':{prisma:db}, './portal-auth':auth});
  const saveAttempt = async (_db, current, book, data) => { await db.quizAttempt.create({data}); return {attempt:data,earned:0}; };
  return load('api/portal.ts', { '../lib/prisma': { prisma: db }, '../lib/portal-auth': auth, '../lib/portal-http': http, '../lib/portal-learning': {saveAttempt} }).default;
}
test('비밀번호 해시 검증, 세션 변조 및 만료를 거부한다', () => {
  assert.equal(auth.verifyPassword('correct-password-for-tests', hash), true);
  assert.equal(auth.verifyPassword('wrong', hash), false);
  assert.equal(auth.verifyPassword('legacy', 'legacy'), false);
  const token = auth.signSession('member-a', hash, 1000);
  assert.equal(auth.readSession(token, 2000).sub, 'member-a');
  assert.equal(auth.readSession(token + 'x', 2000), null);
  assert.equal(auth.readSession(token, 1000 + 8 * 3600000), null);
});
test('로그인 성공에만 HttpOnly 쿠키를 발급하고 평문 비밀번호는 반환하지 않는다', async () => {
  const run = handler(member());
  const res = response();
  await run(request('login', { username: 'student-a', password: 'correct-password-for-tests' }), res);
  assert.equal(res.code, 200); assert.match(res.headers['Set-Cookie'], /HttpOnly/);
  assert.equal(res.data.user.password, undefined);
  const denied = response(); await run(request('login', { username: 'student-a', password: 'wrong' }), denied);
  assert.equal(denied.code, 401); assert.equal(denied.headers['Set-Cookie'], undefined);
});
test('로그인하지 않은 요청과 다른 출처의 변경 요청을 거부한다', async () => {
  const run = handler(member()); const res = response();
  await run(request('learning'), res); assert.equal(res.code, 401);
  const req = request('password', {}, auth.signSession('member-a', hash)); req.headers.origin = 'https://other.example';
  const denied = response(); await run(req, denied); assert.equal(denied.code, 403);
});
test('학습 기록 조회는 학생 본인과 세션의 학원 조건을 강제한다', async () => {
  let where;
  const run = handler(member(), { quizAttempt: { findMany: async query => { where = query.where; return []; } }, book: { findMany: async () => [] } });
  const req = request('learning', undefined, auth.signSession('member-a', hash)); req.query.academyId = 'other';
  const res = response(); await run(req, res);
  assert.equal(res.code, 200); assert.equal(where.memberId, 'member-a'); assert.equal(where.member.academyId, 'academy-a');
});
test('학부모·교사 화면에서 학생 답안을 위조하여 제출하지 못한다', async () => {
  const res = response(); await handler(member('TEACHER'))(request('learning', {}, auth.signSession('member-a', hash)), res);
  assert.equal(res.code, 403);
});
test('서버 문항으로 채점하며 제출자가 보낸 점수·회원 ID를 신뢰하지 않는다', async () => {
  let saved;
  const run = handler(member(), { quizAttempt: { findUnique: async () => null, create: async ({ data }) => { saved = data; } },
    book: { findFirst: async () => ({ id: 'book-id', thinkQuiz: '생각', quizzes: [{ questionNo: 1, question: '문제', quizType: 'MULTIPLE_CHOICE', options: ['정답', '오답'], correctAnswer: '1' }] }) } });
  const res = response(); await run(request('learning', { id: 'L_attempt123', studentId: 'student-a', bookId: 'BOOK1', score: 100, memberId: 'other', quizResults: [{ question: '문제', userChoiceText: '오답' }] }, auth.signSession('member-a', hash)), res);
  assert.equal(res.code, 201); assert.equal(saved.score, 0); assert.equal(saved.memberId, 'member-a');
});
test('완료된 제출 ID로 재시도해도 중복 저장하지 않는다', async () => {
  const run = handler(member(), { quizAttempt: { findUnique: async () => ({ memberId: 'member-a', score: 80, answers: {} }), create: async () => assert.fail('중복 저장') } });
  const res = response(); await run(request('learning', { id: 'L_attempt123', studentId: 'student-a', bookId: 'BOOK1', quizResults: [] }, auth.signSession('member-a', hash)), res);
  assert.equal(res.code, 200); assert.equal(res.data.score, 80);
});
test('비밀번호를 변경한 뒤 이전 세션을 거부한다', async () => {
  const token = auth.signSession('member-a', hash);
  const changed = { ...member(), password: auth.hashPassword('changed-password-for-tests') };
  const res = response(); await handler(changed)(request('session', undefined, token), res);
  assert.equal(res.code, 401);
});

test('다른 탭에서 로그인 계정이 바뀌면 진행 중인 학생 답안 제출을 거부한다', async () => {
  const res = response();
  await handler(member())(request('learning', { studentId: 'another-student' }, auth.signSession('member-a', hash)), res);
  assert.equal(res.code, 409);
});

test('첨삭은 소속 학원으로 제한하고 동시 수정 충돌을 덮어쓰지 않는다', async () => {
  let where;
  const run = handler(member('TEACHER'), { quizAttempt: { findFirst: async query => { where = query.where; return { id: 'L_attempt123', answers: { reviewRevision: 'newer' } }; }, updateMany: async () => assert.fail('충돌 덮어쓰기') } });
  const res = response();
  await run(request('review', { id: 'L_attempt123', comment: '검토', sheet: '작성 완료', reviewed: '첨삭 완료', thoughtHidden: false, reviewRevision: 'older' }, auth.signSession('member-a', hash)), res);
  assert.equal(where.member.academyId, 'academy-a'); assert.equal(res.code, 409);
});

test('초기 데이터 조회를 병렬화해도 사용자 범위와 기존 퀴즈 구조를 유지한다', async () => {
  for (const role of ['MASTER', 'DIRECTOR', 'TEACHER', 'STUDENT']) {
    const user = member(role);
    const queries = {}, pending = [];
    const date = new Date('2026-10-01T00:00:00Z');
    const rows = {
      member: [{ ...user, createdAt: date, updatedAt: date }],
      academy: [{ ...user.academy, id: user.academyId, joinDate: date, startDate: date, endDate: date, _count: { members: 1 } }],
      book: [{ id: 'book-id', bookNo: 'B001', title: '검증 도서', quizzes: [{ id: 'q1', question: '고유문항<검증>', options: ['가', '나'], correctAnswer: '1', questionNo: 1 }], theme: null }]
    };
    const db = {};
    for (const name of ['member', 'academy', 'book', 'classGroup', 'mainBanner', 'themeCategory', 'notice', 'academyBook', 'payment', 'aligoDispatchLog']) {
      db[name] = { findMany: query => {
        queries[name] = query;
        return new Promise(resolve => pending.push(() => resolve(rows[name] || [])));
      } };
    }
    db.member.findUnique = async () => user;
    const run = load('api/bootstrap.ts', { '../lib/prisma': { prisma: db }, '../lib/portal-auth': auth }).default;
    const res = { ...response(), send(value) { this.data = value; return this; } };
    const completion = run(request('bootstrap', undefined, auth.signSession(user.id, hash)), res);
    await new Promise(setImmediate);
    assert.equal(pending.length, 10, '앞선 목록 조회 완료를 기다리지 않고 독립 조회를 시작한다');
    pending.forEach(resolve => resolve());
    await completion;
    assert.equal(res.code, 200);
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(JSON.parse(JSON.stringify(queries.member.where)), role === 'MASTER' ? {} : role === 'STUDENT' ? { id: user.id } : { academyId: user.academyId });
    assert.equal(queries.academy.where.deletedAt, null);
    if (role !== 'MASTER') assert.equal(queries.academy.where.id, user.academyId);
    // 큰 문항 데이터는 한 번만 직렬화하되 두 공개 접근 경로에서 동일하게 읽힙니다.
    assert.equal(res.data.split('고유문항').length - 1, 1);
    const context = { window: {}, sessionStorage: { setItem() {} } };
    vm.runInNewContext(res.data, context);
    const data = context.window;
    assert.deepEqual(JSON.parse(JSON.stringify(data.MIGRATED_BOOKS[0].quizSets)), JSON.parse(JSON.stringify(data.MIGRATED_QUIZZES.B001)));
    assert.equal(data.MIGRATED_BOOKS[0].quizSets[0].questions[0].question, '고유문항<검증>');
    assert.equal(data.MIGRATED_BOOKS[0].quizSets[0].questions[0].ans, 1);
    data.MIGRATED_BOOKS[0].quizSets[0].questions[0].choices[0] = '편집한 보기';
    assert.equal(data.MIGRATED_QUIZZES.B001[0].questions[0].choices[0], '가');
  }
});

test('인증 실패 시 초기 데이터 목록을 조회하지 않는다', async () => {
  const run = load('api/bootstrap.ts', {
    '../lib/prisma': { prisma: { member: { findUnique: async () => assert.fail('인증 전 DB 접근') } } },
    '../lib/portal-auth': auth
  }).default;
  const res = { ...response(), send(value) { this.data = value; return this; } };
  await run(request('bootstrap'), res);
  assert.equal(res.code, 401);
  assert.equal(res.data, 'window.NANO_BOOTSTRAP_FAILED = true;');
});
