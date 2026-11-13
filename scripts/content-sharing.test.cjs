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
  let files = [];
  const directors = [user('director-b', 'b'), user('teacher-c', 'c', 'TEACHER')];
  const db = {
    academy: { findMany: async () => academies },
    member: { findUnique: async () => current, findMany: async ({ where }) => directors.filter(r => matches(r, where)) },
    book: { findFirst: async ({ where }) => { const b = books.find(r => matches(r, where)); return b && { ...b, quizzes: questions.filter(q => q.bookId === b.id) }; }, findUnique: async ({ where }) => books.find(r => matches(r, where)), findMany: async ({ where } = {}) => books.filter(r => matches(r, where)), update: async ({ where, data }) => { const b = books.find(r => matches(r, where)); if (b) Object.assign(b, data); return b; } },
    portalSetting: {
      findMany: async ({ where } = {}) => settings.filter(r => matches(r, where)),
      deleteMany: async ({ where }) => { settings = settings.filter(r => !matches(r, where)); },
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
      findMany: async ({ where }) => files.filter(f => matches(f, where)),
      deleteMany: async ({ where }) => { files = files.filter(f => !matches(f, where)); }
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
  return { db, request, content, portal, user, addQuiz, folder, setUser: u => { current = u; }, settings: () => settings, questions: () => questions, files: () => files };
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

test('나노시트 목록 조회는 업로드 권한(canUpload)과 기관별 소유권(isMine)을 분리해 반환한다', async () => {
  const f = setup();
  const hqUser = { ...f.user('master-hq', 'hq', 'MASTER'), academy: { id: 'hq', code: 'HQ', name: '본사', status: 'ACTIVE', deletedAt: null } };
  const acadA = f.user('owner-a', 'a', 'DIRECTOR');
  const acadB = f.user('owner-b', 'b', 'DIRECTOR');
  const studentB = f.user('student-b', 'b', 'STUDENT');

  // 마스터 본사 시트 1건, 학원 A 공개 시트 1건 등록
  f.setUser(hqUser);
  const hqChunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n본사').toString('base64') });
  const hqSaved = await f.request('worksheet', { bookId: 'book-1', name: '본사_공식.pdf', isPublic: 'Y', fileIds: [hqChunk.data.id] });
  assert.equal(hqSaved.code, 200);

  f.setUser(acadA);
  const aChunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n학원A').toString('base64') });
  const aSaved = await f.request('worksheet', { bookId: 'book-1', name: '학원A_맞춤.pdf', isPublic: 'Y', fileIds: [aChunk.data.id] });
  assert.equal(aSaved.code, 200);

  // 마스터는 본사 시트만 isMine=true, 학원 등록 시트는 isMine=false
  f.setUser(hqUser);
  const hqRes = await f.request('worksheets', undefined, { bookId: 'book-1' });
  assert.equal(hqRes.data.canUpload, true);
  assert.equal(hqRes.data.items.find(s => s.id === hqSaved.data.item.id).isMine, true);
  assert.equal(hqRes.data.items.find(s => s.id === aSaved.data.item.id).isMine, false);

  // 학원 B는 둘 다 남의 시트이므로 isMine=false (단 canUpload=true)
  f.setUser(acadB);
  const bRes = await f.request('worksheets', undefined, { bookId: 'book-1' });
  assert.equal(bRes.data.canUpload, true);
  assert.equal(bRes.data.items.every(s => s.isMine === false), true);

  // 학생은 업로드 불가(canUpload=false) & 목록 선택 열람만 가능
  f.setUser(studentB);
  const sRes = await f.request('worksheets', undefined, { bookId: 'book-1' });
  assert.equal(sRes.data.canUpload, false);
  assert.equal(sRes.data.items.length, 2);
});

test('나노시트 공개/비공개 전환 및 본인 등록 시트만 삭제 가능하며 타인 시트 삭제는 차단한다', async () => {
  const f = setup();
  const hqUser = { ...f.user('master-hq', 'hq', 'MASTER'), academy: { id: 'hq', code: 'HQ', name: '본사', status: 'ACTIVE', deletedAt: null } };
  const acadA = f.user('owner-a', 'a', 'DIRECTOR');
  const acadB = f.user('owner-b', 'b', 'DIRECTOR');

  f.setUser(acadA);
  const aChunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n내시트').toString('base64') });
  const aSaved = await f.request('worksheet', { bookId: 'book-1', name: '내시트.pdf', isPublic: 'N', fileIds: [aChunk.data.id] });
  assert.equal(aSaved.code, 200);
  const sheetId = aSaved.data.item.id;

  // 공개로 전환
  const toggled = await f.request('worksheet', { bookId: 'book-1', id: sheetId, name: '내시트.pdf', isPublic: 'Y', revision: aSaved.data.item.revision });
  assert.equal(toggled.code, 200);
  assert.equal(toggled.data.item.isPublic, 'Y');

  // 타 학원 및 마스터는 학원 A가 올린 시트를 삭제할 수 없음 (403)
  f.setUser(acadB);
  assert.equal((await f.request('worksheet', { operation: 'delete', bookId: 'book-1', id: sheetId })).code, 403);
  f.setUser(hqUser);
  assert.equal((await f.request('worksheet', { operation: 'delete', bookId: 'book-1', id: sheetId })).code, 403);

  // 본인(학원 A)이 삭제하면 정상 삭제되고 파일 청크·목록에서도 제거됨
  f.setUser(acadA);
  const delRes = await f.request('worksheet', { operation: 'delete', bookId: 'book-1', id: sheetId });
  assert.equal(delRes.code, 200);
  assert.equal(delRes.data.deletedId, sheetId);
  assert.equal(f.files().length, 0);
  assert.equal((await f.request('worksheets', undefined, { bookId: 'book-1' })).data.items.length, 0);
});

test('공유 후보(catalog)는 비공개 북퀴즈 또는 비공개 나노시트가 1개 이상 있는 본인 도서만 반환한다', async () => {
  const f = setup();
  // book-1: 공개 퀴즈 + 공개 시트만 있는 경우 -> 제외
  await f.addQuiz('book-1', -10, 'Y', 'owner', 'a');
  const pubChunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n공개').toString('base64') });
  await f.request('worksheet', { bookId: 'book-1', name: '공개시트.pdf', isPublic: 'Y', fileIds: [pubChunk.data.id] });

  // book-2: 공개 퀴즈 + 비공개 시트 -> 비공개 시트가 1개 있으므로 포함
  await f.addQuiz('book-2', -20, 'Y', 'owner', 'a');
  const privChunk = await f.request('sheet-chunk', { base64: Buffer.from('%PDF-1.7\n비공개').toString('base64') });
  await f.request('worksheet', { bookId: 'book-2', name: '비공개시트.pdf', isPublic: 'N', fileIds: [privChunk.data.id] });

  let cat = await f.request('catalog');
  assert.equal(cat.code, 200);
  assert.deepEqual(cat.data.items.map(b => b.id), ['book-2']);
  assert.equal(cat.data.items[0].hasPrivateQuiz, false);
  assert.equal(cat.data.items[0].hasPrivateSheet, true);

  // book-1에 비공개 퀴즈 추가 -> 비공개 퀴즈가 생겼으므로 포함
  await f.addQuiz('book-1', -30, 'N', 'owner', 'a');
  cat = await f.request('catalog');
  assert.deepEqual(cat.data.items.map(b => b.id).sort(), ['book-1', 'book-2']);
  assert.equal(cat.data.items.find(b => b.id === 'book-1').hasPrivateQuiz, true);
});

test('단계별 폴더 워크플로우: 폴더명만 생성 → 대상 설정·도서 수정 분리 및 공개 전환 도서 보존', async () => {
  const f = setup();
  await f.addQuiz('book-1', -10, 'N', 'owner', 'a');

  // 1단계: 폴더명만으로 빈 폴더 생성
  const created = await f.request('folder', { name: '1단계 폴더', bookIds: [], directorUsernames: [] });
  assert.equal(created.code, 200);
  let folders = await f.request('folders');
  assert.equal(folders.data.items.length, 1);
  assert.equal(folders.data.items[0].revision, 1);
  assert.deepEqual(Array.from(folders.data.items[0].bookIds), []);

  // 2단계(도서 수정): 비공개 도서 추가
  const addBooks = await f.request('folder', {
    id: created.data.id,
    revision: 1,
    name: '1단계 폴더',
    bookIds: ['book-1'],
    directorUsernames: []
  });
  assert.equal(addBooks.code, 200);
  folders = await f.request('folders');
  assert.equal(folders.data.items[0].revision, 2);

  // 2단계(공유 대상 설정): 기존 도서를 유지한 채 수신 학원 등록
  const addRecipients = await f.request('folder', {
    id: created.data.id,
    revision: 2,
    name: '1단계 폴더',
    bookIds: ['book-1'],
    directorUsernames: ['director-b']
  });
  assert.equal(addRecipients.code, 200);
  folders = await f.request('folders');
  assert.equal(folders.data.items[0].revision, 3);

  // 이후 book-1 퀴즈를 전체공개로 바꿔 catalog에서 빠져도, 기존 폴더 편집 시 보유 도서 유지 가능
  const pubRes = await f.request('quiz', {
    bookId: 'book-1',
    seq: -10,
    revision: 1,
    isPublic: 'Y',
    questions: [{ question: '질문', type: 'CHOICE', options: ['정답', '오답'], answer: '1' }]
  });
  assert.equal(pubRes.code, 200);
  assert.equal((await f.request('catalog')).data.items.length, 0);

  const preserveBook = await f.request('folder', {
    id: created.data.id,
    revision: 3,
    name: '1단계 폴더',
    bookIds: ['book-1'],
    directorUsernames: []
  });
  assert.equal(preserveBook.code, 200);
  const stored = f.settings().find(r => r.key === 'content_folder:' + created.data.id).value;
  assert.deepEqual(Array.from(stored.bookIds), ['book-1']);
  assert.deepEqual(Array.from(stored.recipients), []);
});
