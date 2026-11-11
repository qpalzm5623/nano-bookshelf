// 실제 추천 API와 완료 화면 함수를 실행해 추천 추가·취소·저장 실패를 검증합니다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');

function load(file, deps) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] || require(name), console });
  return exports;
}

function apiHarness() {
  const http = load('lib/portal-http.ts', { './prisma': {}, './portal-auth': {} });
  const store = new Map([
    ['legacy_book_social_stats', { scope: 'system', value: { recommends: { B1: 39 } } }],
    ['recommends:other-student', { scope: 'book_recommend', value: { books: ['B1'] } }]
  ]);
  let passed = true;
  let readBarrier = null;
  const books = [{ id: 'book-id', bookNo: 'B1', isRecommended: false }, { id: 'book-2-id', bookNo: 'B2', isRecommended: false }];
  const db = {
    book: { findFirst: async ({ where }) => books.find(book => [book.bookNo, book.id].includes(where.OR[0].bookNo)) || null },
    quizAttempt: { findFirst: async ({ where }) => {
      assert.equal(where.memberId, 'student'); assert.ok(books.some(book => book.id === where.bookId)); assert.equal(where.score.gte, 60);
      return passed ? { id: 'attempt' } : null;
    } },
    portalSetting: {
      findUnique: async ({ where }) => {
        const row = store.get(where.key) || null;
        if (where.key === 'recommends:student' && readBarrier) {
          const barrier = readBarrier;
          barrier.remaining -= 1;
          if (!barrier.remaining) { readBarrier = null; barrier.release(); }
          await barrier.promise;
        }
        return row;
      },
      findMany: async ({ where }) => Array.from(store.values()).filter(row => row.scope === where.scope),
      create: async ({ data }) => {
        if (store.has(data.key)) throw Object.assign(Error('Unique key'), { code: 'P2002' });
        const row = { ...data, revision: 1 };
        store.set(data.key, row); return row;
      },
      updateMany: async ({ where, data }) => {
        const previous = store.get(where.key);
        if (!previous || previous.revision !== where.revision) return { count: 0 };
        store.set(where.key, { ...previous, ...data, revision: previous.revision + data.revision.increment });
        return { count: 1 };
      }
    }
  };
  const run = load('api/activity.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': { ...http, authenticate: async () => ({ id: 'student', role: 'STUDENT', academyId: 'academy' }) },
    '../lib/portal-learning': {}
  }).default;
  return {
    store,
    setPassed(value) { passed = value; },
    overlapNextReads(count = 2) {
      let release;
      const promise = new Promise(resolve => { release = resolve; });
      readBarrier = { remaining: count, promise, release };
    },
    async request(body, method = 'POST') {
      const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } };
      await run({ method, query: { action: 'recommend' }, body }, res);
      return res;
    }
  };
}

test('추천 추가·취소는 재전송에도 같은 상태를 유지하고 다른 학생 및 기존 추천 수를 보존한다', async () => {
  const api = apiHarness();
  for (const recommended of [true, true, false, false, true]) {
    const res = await api.request({ bookId: 'B1', recommended });
    assert.equal(res.code, 200);
    assert.equal(res.data.recommended, recommended);
    assert.equal(res.data.recommends, recommended ? 41 : 40);
    assert.deepEqual(Array.from(api.store.get('recommends:student').value.books), recommended ? ['B1'] : []);
  }
  assert.equal(api.store.get('legacy_book_social_stats').value.recommends.B1, 39);
  assert.deepEqual(api.store.get('recommends:other-student').value.books, ['B1']);
  const stored = await api.request({}, 'GET');
  assert.deepEqual(Array.from(stored.data.books), ['B1']);
});

test('추천 취소는 도서 ID와 도서번호를 모두 제거하며 인증·입력 검증을 우회하지 않는다', async () => {
  const api = apiHarness();
  api.store.set('recommends:student', { scope: 'book_recommend', revision: 1, value: { books: ['book-id', 'B1', 'B2'] } });
  const cancelled = await api.request({ bookId: 'book-id', recommended: false });
  assert.equal(cancelled.data.recommended, false);
  assert.equal(cancelled.data.recommends, 40);
  assert.deepEqual(Array.from(api.store.get('recommends:student').value.books), ['B2']);
  assert.equal((await api.request({ bookId: 'B1', recommended: 'false' })).code, 400);
  assert.equal((await api.request({ bookId: 'missing', recommended: true })).code, 404);
  api.setPassed(false);
  assert.equal((await api.request({ bookId: 'B1', recommended: true })).code, 403);
  assert.equal((await api.request({ bookId: 'B1', recommended: false })).code, 403);
});

test('서로 다른 탭의 A 추천 취소와 B 추천이 겹쳐도 두 변경을 모두 보존한다', async () => {
  const api = apiHarness();
  await api.request({ bookId: 'B1', recommended: true });
  api.overlapNextReads();
  const results = await Promise.all([
    api.request({ bookId: 'B1', recommended: false }),
    api.request({ bookId: 'B2', recommended: true })
  ]);
  assert.ok(results.every(res => res.code === 200));
  assert.deepEqual(Array.from(api.store.get('recommends:student').value.books), ['B2']);
  assert.equal(api.store.get('recommends:student').revision, 3);
});

test('추천 목록의 최초 생성이 겹쳐도 두 도서를 모두 보존한다', async () => {
  const api = apiHarness();
  api.overlapNextReads();
  const results = await Promise.all([
    api.request({ bookId: 'B1', recommended: true }),
    api.request({ bookId: 'B2', recommended: true })
  ]);
  assert.ok(results.every(res => res.code === 200));
  assert.deepEqual(Array.from(api.store.get('recommends:student').value.books).sort(), ['B1', 'B2']);
  assert.equal(api.store.get('recommends:student').revision, 2);
});

test('같은 추천 상태의 재전송도 다른 탭의 신규 추천을 덮어쓰지 않는다', async () => {
  const api = apiHarness();
  await api.request({ bookId: 'B1', recommended: true });
  api.overlapNextReads();
  const results = await Promise.all([
    api.request({ bookId: 'B1', recommended: true }),
    api.request({ bookId: 'B2', recommended: true })
  ]);
  assert.ok(results.every(res => res.code === 200));
  assert.deepEqual(Array.from(api.store.get('recommends:student').value.books).sort(), ['B1', 'B2']);
});

function uiHarness(options = {}) {
  const store = new Map(), requests = [], messages = [];
  const classes = new Set(), attributes = new Map([['data-book-id', 'B1']]);
  const text = { textContent: options.recommended ? '추천 완료' : '추천하기' }, speech = { textContent: '원래 대사' };
  const classList = values => ({
    add: value => values.add(value), remove: value => values.delete(value),
    toggle(value, on) { if (on) values.add(value); else values.delete(value); }
  });
  const cardClasses = new Set();
  const card = { classList: classList(cardClasses), querySelector: () => speech, offsetWidth: 10 };
  const btn = {
    disabled: false, classList: classList(classes), closest: () => card, querySelector: () => text,
    getAttribute: key => attributes.get(key), setAttribute: (key, value) => attributes.set(key, value), removeAttribute: key => attributes.delete(key)
  };
  const book = { id: 'B1', bookNo: 'B1', serverId: 'book-id', recommends: options.recommended ? 40 : 39 };
  const ctx = vm.createContext({
    activeQuizResultView: { score: 80, book, extra: { isRecommended: !!options.recommended, speechText: '원래 대사' } },
    NANO_USER_RECOMMENDS: options.recommended ? ['B1', 'book-id'] : [],
    getStudentQuizIdentity: () => ({ studentId: 'student' }), libData: [book], MIGRATED_BOOKS: [book],
    CHAR_RECOMMEND_REACTIONS: { nano: '추천 반응' }, document: { querySelector: () => card },
    localStorage: { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) },
    toast: message => messages.push(message), setTimeout: () => 1, clearTimeout() {},
    NanoPortal: {
      remote: options.remote !== false,
      async api(url, body) {
        requests.push({ url, body });
        if (options.api) return options.api(body);
        return { bookNo: 'B1', recommended: body.recommended, recommends: body.recommended ? 40 : 39 };
      }
    }
  });
  ctx.window = ctx;
  const html = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(match => match[1]).join('\n');
  const ast = ts.createSourceFile('student.js', script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  for (const name of ['getStudentRecommendCacheKey', 'isBookRecommendedByStudent', 'syncRecommendedBookCountInMemory', 'handleQuizBookRecommend']) {
    const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === name);
    assert.ok(node, name);
    vm.runInContext(node.getText(ast), ctx);
  }
  return { ctx, btn, book, text, speech, classes, attributes, cardClasses, requests, messages, store };
}

test('완료 화면에서 추천→취소→재추천 시 표시·캐시·추천 수가 동기화되고 취소에는 축하하지 않는다', async () => {
  const ui = uiHarness();
  for (const recommended of [true, false, true]) {
    await ui.ctx.handleQuizBookRecommend(ui.btn);
    assert.equal(ui.requests.at(-1).body.recommended, recommended);
    assert.equal(ui.text.textContent, recommended ? '추천 완료' : '추천하기');
    assert.equal(ui.attributes.get('aria-pressed'), String(recommended));
    assert.equal(ui.cardClasses.has('is-celebrating'), recommended);
    assert.equal(ui.ctx.activeQuizResultView.extra.isRecommended, recommended);
    assert.equal(ui.book.recommends, recommended ? 40 : 39);
    assert.deepEqual(JSON.parse(ui.store.get('NANO_USER_RECOMMENDED_BOOKS:student')), recommended ? ['B1'] : []);
    assert.equal(ui.btn.disabled, false);
  }
});

test('취소 요청 중 중복 클릭은 무시하고 실패하면 추천 완료 상태와 수를 유지한다', async () => {
  let reject;
  const ui = uiHarness({ recommended: true, api: () => new Promise((resolve, fail) => { reject = fail; }) });
  const pending = ui.ctx.handleQuizBookRecommend(ui.btn);
  assert.equal(ui.btn.disabled, true);
  await ui.ctx.handleQuizBookRecommend(ui.btn);
  assert.equal(ui.requests.length, 1);
  reject(Error('저장 실패'));
  await pending;
  assert.equal(ui.text.textContent, '추천 완료');
  assert.equal(ui.book.recommends, 40);
  assert.equal(ui.ctx.isBookRecommendedByStudent(ui.book), true);
  assert.equal(ui.ctx.activeQuizResultView.extra.isRecommended, true);
  assert.equal(ui.btn.disabled, false);
  assert.equal(ui.attributes.has('aria-busy'), false);
  assert.equal(ui.messages.at(-1), '저장 실패');
});

test('서버 목록은 오래된 캐시보다 우선하며 로컬 추천 취소도 공유 도서 객체를 한 번만 차감한다', async () => {
  const ui = uiHarness({ remote: false });
  ui.store.set('NANO_USER_RECOMMENDED_BOOKS:student', JSON.stringify(['B1']));
  assert.equal(ui.ctx.isBookRecommendedByStudent(ui.book), false);
  await ui.ctx.handleQuizBookRecommend(ui.btn);
  assert.equal(ui.book.recommends, 40);
  assert.equal(JSON.parse(ui.store.get('NANO_BOOK_RECOMMEND_COUNTS')).B1, 1);
  await ui.ctx.handleQuizBookRecommend(ui.btn);
  assert.equal(ui.book.recommends, 39);
  assert.equal(JSON.parse(ui.store.get('NANO_BOOK_RECOMMEND_COUNTS')).B1, 0);
  assert.equal(ui.ctx.isBookRecommendedByStudent(ui.book), false);
  assert.equal(ui.cardClasses.has('is-celebrating'), false);
});
