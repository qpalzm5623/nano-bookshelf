// 실제 API와 예약 로직을 실행하고 외부 발송·DB는 메모리 대역으로 대체합니다.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const crypto = require('node:crypto');
const silent = { info() {}, warn() {}, error() {}, log() {} };
const need = (ok, message, status = 400) => { if (!ok) throw Object.assign(new Error(message), { status }); };
const env = { ALIGO_API_KEY: 'test', ALIGO_USER_ID: 'test', ALIGO_SENDER_KEY: 'test', ALIGO_SENDER: '01000000000', PORTAL_AUTH_SECRET: 'test-only-secret-with-more-than-32-characters' };
function load(file, deps = {}, extra = {}) {
  const exports = {};
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] || require(name), process: { env }, console: silent, Buffer, URL, URLSearchParams, AbortSignal, Date, ...extra });
  return exports;
}
function fixture() {
  const rows = new Map(), ledger = [];
  let chain = Promise.resolve(), sends = 0, balance = 10000;
  const member = { id: 'member-1', academyId: 'academy-1', name: '학생', parentName: '보호자', parentPhone: '01012345678', reportYn: true };
  const record = { id: 'literacy-record-1', memberId: member.id, academyId: member.academyId, finishedAt: new Date(), result: { level: 5 } };
  const db = {
    $executeRaw: async () => 1,
    member: { findFirst: async () => member },
    academy: { updateMany: async ({ data }) => { balance += data.kakaoBalance.increment; return { count: 1 }; } },
    kakaoLedger: { create: async ({ data }) => { ledger.push(data); return data; } },
    quizAttempt: { findFirst: async () => ({ id: 'quiz-1', member, bookId: 'book-1', completedAt: new Date(), score: 80 }) },
    book: { findFirst: async () => ({ title: '도서' }) },
    portalSetting: { findUnique: async ({ where }) => ({ key: where.key, value: where.key.startsWith('literacy_result:') ? record : { memberId: member.id, books: [], from: '2026-10-01', to: '2026-11-01' } }) },
    aligoDispatchLog: {
      findMany: async ({ where }) => [...rows.values()].filter(r => r.academyId === where.academyId && r.memberId === where.memberId).reverse(),
      findUnique: async ({ where }) => rows.get(where.id),
      create: async ({ data }) => { assert.ok(!rows.has(data.id)); const r = { ...data, sentAt: new Date() }; rows.set(data.id, r); return r; },
      update: async ({ where, data }) => Object.assign(rows.get(where.id), data),
      updateMany: async ({ where, data }) => {
        const row = rows.get(where.id);
        const allowed = typeof where.status === 'string' ? row?.status === where.status : where.status?.in?.includes(row?.status);
        if (!row || !allowed) return { count: 0 };
        Object.assign(row, data); return { count: 1 };
      },
    },
    $transaction: fn => {
      const result = chain.then(() => fn(db)); chain = result.catch(() => {}); return result;
    },
  };
  const fakeFetch = async () => { sends++; return { ok: true, json: async () => ({ code: 0, info: { mid: String(sends) }, message: '접수' }) }; };
  const policy = load('lib/billing-policy.ts');
  const wallet = load('lib/kakao-wallet.ts', { './prisma': { prisma: db }, './portal-http': { need }, './billing-policy': policy, undici: { ProxyAgent: class {} } });
  const http = { need, authenticate: async () => ({ role: 'DIRECTOR', academyId: member.academyId }), staff() {}, failure: (res, e) => res.status(e.status || 500).json({ error: e.message }) };
  const handler = load('api/services.ts', { '../lib/prisma': { prisma: db }, '../lib/kakao-wallet': wallet, '../lib/billing-policy': policy, '../lib/portal-http': http, '../lib/dispatch-view': load('lib/dispatch-view.ts'), undici: { ProxyAgent: class {} } }, { fetch: fakeFetch }).default;
  // 문해력 전용 API의 실제 발송 함수를 실행합니다.
  const litSource = fs.readFileSync('api/literacy.ts', 'utf8');
  const ast = ts.createSourceFile('literacy.ts', litSource, ts.ScriptTarget.Latest, true);
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'sendKakao');
  const litCode = ts.transpileModule(fn.getText(ast), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  const lit = { ...wallet, ...crypto, prisma: db, need, process: { env }, console: silent, URLSearchParams, AbortSignal,
    DEFAULT_LITERACY_TEMPLATE: '#{학생명} 진단 결과 #{링크}', shareUrl: () => 'https://www.nanosbook.co.kr/literacy_report?r=' + record.id + '&t=test', formatKstDateTime24: () => '2026-11-16', aligoFetch: fakeFetch, proxyDispatcher: null };
  vm.createContext(lit); vm.runInContext(litCode, lit);
  async function request(type, action, preview = {}) {
    const body = { type, action, logId: 'quiz-1', pfId: 'pf-1', recordId: record.id, fingerprint: preview.fingerprint, attemptNumber: preview.attemptNumber };
    const req = { method: 'POST', headers: { host: 'www.nanosbook.co.kr' }, query: {}, body };
    const res = { code: 200, setHeader() {}, status(n) { this.code = n; return this; }, json(data) { this.body = data; return this; } };
    if (type === 'literacy-native') {
      try { await lit.sendKakao(req, res, member.academyId, record, action === 'preview', body.fingerprint || ''); }
      catch (e) { http.failure(res, e); }
    } else await handler(req, res);
    return res;
  }
  return { request, rows, ledger, wallet, member, db, get sends() { return sends; }, get balance() { return balance; } };
}
for (const type of ['quiz', 'portfolio', 'literacy', 'literacy-native']) {
  test(type + ': 1~3회 발송, 같은 요청 재전송은 차감하지 않고 4회는 거부', async () => {
    const f = fixture();
    for (let i = 1; i <= 3; i++) {
      const pv = await f.request(type, 'preview');
      assert.equal(pv.code, 200, pv.body.error);
      assert.equal(pv.body.sentCount, i - 1);
      assert.equal(pv.body.attemptNumber, i);
      const sent = await f.request(type, 'send', pv.body);
      assert.equal(sent.code, 200, sent.body.error);
      assert.equal(sent.body.status, 'ACCEPTED');
      const duplicate = await f.request(type, 'send', pv.body);
      assert.equal(duplicate.body.duplicate, true);
      assert.equal(f.sends, i);
    }
    const pv = await f.request(type, 'preview');
    assert.equal(pv.body.remainingSends, 0);
    const rejected = await f.request(type, 'send', pv.body);
    assert.equal(rejected.code, 409);
    assert.match(rejected.body.error, /최대 3회/);
    assert.equal(f.sends, 3);
    assert.equal(f.ledger.length, 3);
  });
}
test('이전 URL 이력도 포함하고 문해력 두 API를 번갈아 사용해도 합계 3회 제한', async () => {
  const f = fixture();
  f.rows.set('legacy', { id: 'legacy', academyId: f.member.academyId, memberId: f.member.id, status: 'SUCCESS', sentAt: new Date(),
    payload: { buttonJson: JSON.stringify({ button: [{ linkM: 'https://nanosbook.co.kr/literacy_report.html?r=literacy-record-1&t=old' }] }) } });
  let pv = await f.request('literacy', 'preview');
  assert.equal(pv.body.sentCount, 1);
  await f.request('literacy', 'send', pv.body);
  pv = await f.request('literacy-native', 'preview');
  assert.equal(pv.body.sentCount, 2);
  await f.request('literacy-native', 'send', pv.body);
  pv = await f.request('literacy', 'preview');
  assert.equal(pv.body.sentCount, 3);
  assert.equal((await f.request('literacy', 'send', pv.body)).code, 409);
  assert.equal(f.sends, 2);
});
test('3회차 동시 요청은 한 번만 예약·발송·차감한다', async () => {
  const f = fixture();
  for (let i = 0; i < 2; i++) { const p = await f.request('quiz', 'preview'); await f.request('quiz', 'send', p.body); }
  const p = await f.request('quiz', 'preview');
  const results = await Promise.all([f.request('quiz', 'send', p.body), f.request('quiz', 'send', p.body)]);
  assert.equal(results.filter(r => r.body.duplicate).length, 1);
  assert.equal(f.sends, 3);
  assert.equal(f.ledger.length, 3);
});
test('실패 확정 건은 횟수에서 제외하고 이전 미리보기로 추가 발송을 우회하지 못한다', async () => {
  const f = fixture();
  const p = await f.request('quiz', 'preview');
  await f.request('quiz', 'send', p.body);
  const row = [...f.rows.values()][0];
  row.status = 'FAILED'; row.refundedAt = new Date();
  const retry = await f.request('quiz', 'preview');
  assert.equal(retry.body.sentCount, 0);
  assert.equal((await f.request('quiz', 'send', retry.body)).body.status, 'ACCEPTED');
  const replay = await f.request('quiz', 'send', p.body);
  assert.equal(replay.body.duplicate, true);
  assert.equal(f.sends, 2);
});

test('수신번호가 달라진 두 3회차 요청도 서버 예약 단계에서 합계 제한을 지킨다', async () => {
  const f = fixture();
  for (let i = 0; i < 2; i++) { const p = await f.request('portfolio', 'preview'); await f.request('portfolio', 'send', p.body); }
  const first = await f.request('portfolio', 'preview');
  await f.request('portfolio', 'send', first.body);
  f.member.parentPhone = '01099998888';
  const fresh = await f.request('portfolio', 'preview');
  assert.equal(fresh.body.sentCount, 3);
  // 미리보기 횟수 조작은 지문 검증에서 거절합니다.
  const forged = await f.request('portfolio', 'send', { ...fresh.body, attemptNumber: 3 });
  assert.equal(forged.code, 409);
  // 지문을 알아도 예약 시 서버에서 다시 집계하므로 4번째 발송을 만들지 못합니다.
  await assert.rejects(f.wallet.reserveDispatch({ id: 'forged', academyId: f.member.academyId }, f.member,
    { reportKey: 'portfolio:pf-1', attemptNumber: 3 }), /최대 3회/);
  assert.equal(f.sends, 3);
  assert.equal(f.ledger.length, 3);
});
