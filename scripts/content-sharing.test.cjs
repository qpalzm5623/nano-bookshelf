const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
function load(file, deps) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] || (name.endsWith('.json') ? JSON.parse(fs.readFileSync(path.resolve(root, path.dirname(file), name), 'utf8')) : require(name)), Buffer, console, URL, Date, process: { env: { DATABASE_URL: 'postgresql://test.invalid/test', PORTAL_AUTH_SECRET: 'test-only-content-sharing-secret-32-chars' } } });
  return exports;
}
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(w => matches(row, w));
    if (value && typeof value === 'object') {
      if ('in' in value) return value.in.includes(row[key]);
      return matches(row[key] || {}, value);
    }
    return row[key] === value;
  });
}
function setup() {
  const academies = ['a', 'b', 'c'].map(id => ({ id, code: id.toUpperCase(), name: id + '학원', status: 'ACTIVE', deletedAt: null }));
  const user = (id, academyId, role = 'DIRECTOR') => ({ id, academyId, role, username: id, name: id, status: 'APPROVED', password: 'fake', academy: academies.find(a => a.id === academyId) });
  let current = user('owner', 'a');
  let settings = [];
  let questions = [];
  const books = [{ id: 'book-1', bookNo: 'B1', title: '첫 번째 책' }, { id: 'book-2', bookNo: 'B2', title: '다른 책' }];
  const files = [];
  const directors = [user('director-b', 'b'), user('teacher-c', 'c', 'TEACHER')];
  const db = {
    academy: { findMany: async () => academies },
    member: { findUnique: async () => current, findMany: async ({ where }) => directors.filter(r => matches(r, where)) },
    book: { findFirst: async ({ where }) => { const b = books.find(r => matches(r, where)); return b && { ...b, quizzes: questions.filter(q => q.bookId === b.id) }; }, findUnique: async ({ where }) => books.find(r => matches(r, where)), findMany: async ({ where } = {}) => books.filter(r => matches(r, where)) },
    portalSetting: {
      findMany: async ({ where } = {}) => settings.filter(r => matches(r, where)),
      findUnique: async ({ where }) => settings.find(r => r.key === where.key) || null,
      create: async ({ data }) => { if (settings.some(r => r.key === data.key)) throw Object.assign(Error('duplicate'), { code: 'P2002' }); const row = { ...data, revision: 1 }; settings.push(row); return row; },
      updateMany: async ({ where, data }) => { const row = settings.find(r => matches(r, where)); if (!row) return { count: 0 }; row.value = data.value; row.revision++; return { count: 1 }; }
    },
    bookQuiz: {
      groupBy: async () => [...new Map(questions.map(q => [q.bookId + ':' + q.legacyQuizSeq, { bookId: q.bookId, legacyQuizSeq: q.legacyQuizSeq }])).values()],
      deleteMany: async ({ where }) => { questions = questions.filter(q => !matches(q, where)); },
      createMany: async ({ data }) => { questions.push(...data.map((q, i) => ({ ...q, id: 'q-' + q.legacyQuizSeq + '-' + i }))); }
    },
    portalFile: {
      create: async ({ data }) => { const f = { ...data, id: 'file-' + files.length }; files.push(f); return { id: f.id }; },
      findUnique: async ({ where }) => files.find(f => f.id === where.id),
      findMany: async ({ where }) => files.filter(f => matches(f, where))
    },
    quizAttempt: { findUnique: async () => null },
    $queryRaw: async () => [],
    $transaction: async fn => { const oldSettings = structuredClone(settings), oldQuestions = structuredClone(questions); try { return await fn(db); } catch (err) { settings = oldSettings; questions = oldQuestions; throw err; } }
  };
  const http = load('lib/portal-http.ts', { './prisma': { prisma: db }, './portal-auth': {} });
  const content = load('lib/portal-content.ts', { './portal-http': http });
  const run = load('api/content.ts', { '../lib/prisma': { prisma: db }, '../lib/portal-http': { ...http, authenticate: async () => current }, '../lib/portal-content': content }).default;
  const portal = load('api/portal.ts', { '../lib/prisma': { prisma: db }, '../lib/portal-http': http, '../lib/portal-content': content,
    '../lib/portal-auth': { readSession: () => ({ sub: current.id, version: 'v' }), passwordVersion: () => 'v' },
    '../lib/portal-learning': {
      saveAttempt: async (_db, _user, _book, attempt) => ({ attempt: { ...attempt, completedAt: new Date() }, isCertified: attempt.score >= 60, earned: 0, roundNum: 1 }),
      estimateAttemptPoints: () => 0
    } }).default;
  async function request(action, body, query = {}, handler = run) {
    const res = { code: 200, headers: {}, chunks: [], setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(data) { this.data = data; return this; }, write(data) { this.chunks.push(Buffer.from(data)); this.headersSent = true; }, end() {}, redirect(code, url) { this.code = code; this.url = url; } };
    await handler({ query: { action, ...query }, body, method: body === undefined ? 'GET' : 'POST', headers: { origin: 'https://test.example', host: 'test.example', 'content-type': 'application/json', cookie: 'nano_portal=test', ...query.headers } }, res);
    return res;
  }
  async function addQuiz(bookId = 'book-1', seq = -10, isPublic = 'N', ownerId = 'owner', academyId = 'a') {
    await db.portalSetting.create({ data: { key: `content_quiz:${bookId}:${seq}`, scope: 'content_quiz', value: { bookId, seq, ownerAcademyId: academyId, ownerMemberId: ownerId, academyName: academyId + '학원', authorType: 'ACADEMY', isPublic } } });
    questions.push({ id: 'q' + seq, bookId, legacyQuizSeq: seq, questionNo: 1, question: '질문' + seq, quizType: 'MULTIPLE_CHOICE', options: ['정답', '오답'], correctAnswer: '1' });
  }
  async function folder() { return request('folder', { name: '함께 읽기', bookIds: ['book-1'], directorUsernames: ['director-b'] }); }
  return { db, request, content, portal, user, addQuiz, folder, setUser: u => { current = u; }, settings: () => settings, questions: () => questions };
}

test('직접 등록한 콘텐츠만 폴더 후보로 제공하고 원장 ID를 학원 권한으로 변환한다', async () => {
  const f = setup(); await f.addQuiz(); await f.addQuiz('book-2', -11, 'Y', 'other-author');
  const catalog = await f.request('catalog');
  assert.deepEqual(Array.from(catalog.data.items, b => b.id), ['book-1']);
  const created = await f.folder(); assert.equal(created.code, 200);
  const value = f.settings().find(r => r.scope === 'content_folder').value;
  assert.equal(value.recipients[0].academyId, 'b'); assert.equal(value.ownerMemberId, 'owner');
  const denied = await f.request('folder', { name: '위조', ownerMemberId: 'other-author', bookIds: ['book-2'], directorUsernames: ['director-b'] });
  assert.equal(denied.code, 403);
});

test('없는 ID와 교사 ID를 공유받을 학원장으로 등록할 수 없다', async () => {
  const f = setup(); await f.addQuiz();
  for (const id of ['missing', 'teacher-c']) {
    assert.equal((await f.request('folder', { name: '폴더', bookIds: ['book-1'], directorUsernames: [id] })).code, 400);
  }
  assert.equal(f.settings().filter(r => r.scope === 'content_folder').length, 0);
});

test('공개·자기 학원·공유 학원에 같은 읽기 정책을 적용하고 도서/수신 학원 해제를 즉시 반영한다', async () => {
  const f = setup(); await f.addQuiz(); await f.addQuiz('book-1', -20, 'Y', 'other', 'c');
  const created = await f.folder();
  for (const role of ['DIRECTOR', 'TEACHER', 'STUDENT']) {
    for (const academy of ['a', 'b', 'c']) {
      f.setUser(f.user('reader', academy, role));
      const r = await f.request('quiz', undefined, { bookId: 'book-1' }, f.portal);
      assert.equal(r.code, 200); assert.equal(r.data.quizSets.length, academy === 'c' ? 1 : 2);
      if (role === 'STUDENT') assert.equal(r.data.quizSets[0].questions[0].ans, undefined);
    }
  }
  f.setUser(f.user('owner', 'a'));
  assert.equal((await f.request('folder', { id: created.data.id, revision: 1, name: '공유 해제', bookIds: [], directorUsernames: ['director-b'] })).code, 200);
  f.setUser(f.user('reader', 'b', 'STUDENT'));
  assert.equal((await f.request('quiz', undefined, { bookId: 'book-1' }, f.portal)).data.quizSets.length, 1);
  f.setUser(f.user('owner', 'a'));
  await f.request('folder', { id: created.data.id, revision: 2, name: '학원 해제', bookIds: ['book-1'], directorUsernames: [] });
  f.setUser(f.user('reader', 'b', 'TEACHER'));
  assert.equal((await f.request('quiz', undefined, { bookId: 'book-1' }, f.portal)).data.quizSets.length, 1);
});

test('공유받은 폴더 편집과 오래된 수정 요청을 거부한다', async () => {
  const f = setup(); await f.addQuiz(); const created = await f.folder();
  const payload = { id: created.data.id, revision: 1, name: '수정', bookIds: ['book-1'], directorUsernames: [] };
  f.setUser(f.user('director-b', 'b'));
  assert.equal((await f.request('folder', payload)).code, 403);
  f.setUser(f.user('owner', 'a'));
  assert.equal((await f.request('folder', payload)).code, 200);
  assert.equal((await f.request('folder', payload)).code, 409);
});

test('여러 학원의 시트를 필터링하며 공유 해제 후 PDF 직접 열기도 차단한다', async () => {
  const f = setup();
  const chunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n테스트').toString('base64') });
  const saved = await f.request('worksheet', { bookId: 'book-1', name: '원본.pdf', isPublic: 'N', fileIds: [chunk.data.id] });
  assert.equal(saved.code, 200);
  assert.equal(saved.data.item.revision, 1);
  const folder = await f.folder(); assert.equal(folder.code, 200);
  f.setUser(f.user('publisher', 'c'));
  const publicChunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n공개 자료').toString('base64') });
  await f.request('worksheet', { bookId: 'book-1', name: '다른 학원.pdf', isPublic: 'Y', fileIds: [publicChunk.data.id] });
  f.setUser(f.user('reader', 'b', 'STUDENT'));
  const sheets = (await f.request('worksheets', undefined, { bookId: 'book-1' })).data.items;
  assert.equal(sheets.length, 2);
  assert.deepEqual(Array.from(sheets, s => s.academyName), ['a학원', 'c학원']);
  const file = await f.request('file', undefined, { id: saved.data.item.id, headers: { range: 'bytes=0-4' } });
  assert.equal(file.code, 206); assert.equal(Buffer.concat(file.chunks).toString(), '%PDF-');
  assert.equal(file.headers['Cache-Control'], 'no-store');
  f.setUser(f.user('reader', 'c', 'TEACHER'));
  assert.equal((await f.request('worksheets', undefined, { bookId: 'book-1' })).data.items.length, 1);
  assert.equal((await f.request('file', undefined, { id: saved.data.item.id })).code, 403);
  f.setUser(f.user('owner', 'a'));
  await f.request('folder', { id: folder.data.id, revision: 1, name: '해제', bookIds: ['book-1'], directorUsernames: [] });
  f.setUser(f.user('reader', 'b', 'STUDENT'));
  assert.equal((await f.request('file', undefined, { id: saved.data.item.id })).code, 403);
});

test('다른 사용자의 PDF 파일 ID를 재사용하거나 학생이 업로드할 수 없다', async () => {
  const f = setup();
  const chunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7').toString('base64') });
  f.setUser(f.user('other', 'b'));
  assert.equal((await f.request('worksheet', { bookId: 'book-1', name: '도용.pdf', isPublic: 'Y', fileIds: [chunk.data.id] })).code, 403);
  f.setUser(f.user('student', 'b', 'STUDENT'));
  assert.equal((await f.request('sheet-chunk', { base64: 'JVBERi0=' })).code, 403);
});

test('퀴즈 공개 범위 저장은 타 학원 세트를 보존하고 타 학원 수정은 거부한다', async () => {
  const f = setup(); await f.addQuiz(); await f.addQuiz('book-1', -20, 'Y', 'other', 'c');
  const payload = { bookId: 'book-1', seq: -10, revision: 1, isPublic: 'Y', questions: [{ question: '수정한 문제', type: 'CHOICE', options: ['가', '나'], answer: '2' }] };
  assert.equal((await f.request('quiz', payload)).code, 200);
  assert.ok(f.questions().some(q => q.legacyQuizSeq === -20));
  assert.equal((await f.request('quiz', payload)).code, 409);
  f.setUser(f.user('other', 'b'));
  assert.equal((await f.request('quiz', { ...payload, revision: 2 })).code, 403);
  const access = await f.content.loadContentAccess(f.db);
  assert.equal(f.content.quizContent(access, 'book-1', -10).isPublic, 'Y');
});

test('공유 해제된 비공개 퀴즈의 답안 제출도 서버에서 거부한다', async () => {
  const f = setup(); await f.addQuiz(); f.setUser(f.user('student', 'b', 'STUDENT'));
  const r = await f.request('learning', { id: 'L_attempt123', studentId: 'student', bookId: 'book-1', quizResults: [{ question: '질문-10', userChoiceText: '정답' }] }, {}, f.portal);
  assert.equal(r.code, 409);
});

test('문항 내용이 같은 세트도 선택한 세트의 정답으로 채점하고 권한 없는 세트 지정은 거부한다', async () => {
  const f = setup();
  await f.addQuiz('book-1', -10, 'Y');
  await f.addQuiz('book-1', -20, 'Y', 'other', 'c');
  await f.addQuiz('book-1', -30, 'N');
  f.questions()[1].question = f.questions()[0].question;
  f.questions()[1].correctAnswer = '2';
  f.setUser(f.user('student', 'b', 'STUDENT'));
  const payload = { id: 'L_selectedset', studentId: 'student', bookId: 'book-1', quizSetSeq: -20, quizResults: [{ question: '질문-10', userChoiceText: '오답' }] };
  const selected = await f.request('learning', payload, {}, f.portal);
  assert.equal(selected.code, 201); assert.equal(selected.data.score, 100);
  assert.equal((await f.request('learning', { ...payload, quizSetSeq: -10 }, {}, f.portal)).data.score, 0);
  assert.equal((await f.request('learning', { ...payload, quizSetSeq: -30 }, {}, f.portal)).code, 403);
});
