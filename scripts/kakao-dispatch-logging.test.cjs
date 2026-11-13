const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadTs(relPath, deps = {}, extra = {}) {
  const exports = {};
  const src = fs.readFileSync(path.join(root, relPath), 'utf8');
  const code = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const fakeConsole = extra.console || console;
  vm.runInNewContext(code, {
    exports,
    require: name => deps[name] || require(name),
    Buffer,
    process: extra.process || { env: {} },
    console: fakeConsole,
    URL,
    URLSearchParams,
    AbortSignal,
    Date,
    ...extra,
  });
  return exports;
}

function need(cond, msg, status = 400) {
  if (!cond) {
    const err = new Error(msg);
    err.status = status;
    throw err;
  }
}

function createLogSpy() {
  const entries = [];
  const rec = level => (...args) => entries.push({ level, tag: String(args[0] || ''), payload: args[1] });
  return {
    entries,
    logger: { log: rec('log'), info: rec('info'), warn: rec('warn'), error: rec('error') },
  };
}

test('maskPhone은 전화번호 가운데 자리를 마스킹하고 reconcileDispatches는 24시간 이내 실패 사유를 즉시 기록·로깅한다', async () => {
  const spy = createLogSpy();
  const policy = loadTs('lib/billing-policy.ts');
  const rowState = {
    id: 'quiz_recent',
    academyId: 'acad_1',
    recipientName: '김학부모',
    recipientPhone: '01084349832',
    templateCode: 'UN_5524',
    status: 'ACCEPTED',
    providerId: '1503785807',
    resultCode: '0',
    resultMessage: '성공적으로 전송요청 하였습니다.',
    sentAt: new Date(Date.now() - 5 * 60 * 1000),
    checkedAt: null,
    fallbackId: null,
    debitAmount: 85,
    refundedAt: null,
  };
  let balance = 50000;
  const db = {
    academy: {
      updateMany: async ({ data }) => {
        balance += data.kakaoBalance.increment;
        return { count: 1 };
      },
    },
    kakaoLedger: { create: async () => ({}) },
    aligoDispatchLog: {
      findMany: async () => [rowState],
      findUnique: async () => rowState,
      update: async ({ data }) => Object.assign(rowState, data),
      updateMany: async ({ data }) => { Object.assign(rowState, data); return { count: 1 }; },
    },
    $transaction: fn => fn(db),
  };

  const wallet = loadTs('lib/kakao-wallet.ts', {
    './prisma': { prisma: db },
    './portal-http': { need },
    './billing-policy': policy,
    undici: { ProxyAgent: class {} },
  }, {
    console: spy.logger,
    fetch: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        code: 0,
        message: '성공',
        list: [{
          msgid: '1503785807_1',
          receiver: '01084349832',
          rslt: 'U',
          rslt_message: '메시지가 템플릿과 일치하지않음',
          rsltdate: '2026-11-13 14:34:41',
          smid: '0',
        }],
      }),
    }),
  });

  assert.equal(wallet.maskPhone('01084349832'), '010****9832');
  const checked = await wallet.reconcileDispatches('acad_1', { apikey: 'key', userid: 'uid' });
  assert.equal(checked, 1);
  // 환급은 24시간 이후로 보류되지만 실패 원인과 코드는 즉시 기록된다.
  assert.equal(rowState.status, 'ACCEPTED');
  assert.equal(balance, 50000);
  assert.equal(rowState.resultCode, 'U');
  assert.equal(rowState.resultMessage, '메시지가 템플릿과 일치하지않음');
  assert.ok(rowState.checkedAt instanceof Date);
  assert.ok(spy.entries.some(e => e.level === 'warn' && e.tag === '[Aligo] reconcile_detail' && e.payload.rsltMessage === '메시지가 템플릿과 일치하지않음'));
});

test('reconcileDispatches 예외는 삼키지 않고 Vercel 런타임 로그(error)로 남긴다', async () => {
  const spy = createLogSpy();
  const policy = loadTs('lib/billing-policy.ts');
  const rowState = {
    id: 'quiz_err',
    academyId: 'acad_1',
    recipientPhone: '01012345678',
    status: 'ACCEPTED',
    providerId: '999999',
    sentAt: new Date(Date.now() - 120000),
    checkedAt: null,
  };
  const db = {
    aligoDispatchLog: {
      findMany: async () => [rowState],
      update: async ({ data }) => Object.assign(rowState, data),
    },
  };
  const wallet = loadTs('lib/kakao-wallet.ts', {
    './prisma': { prisma: db },
    './portal-http': { need },
    './billing-policy': policy,
    undici: { ProxyAgent: class {} },
  }, {
    console: spy.logger,
    fetch: async () => ({ ok: false, status: 502, json: async () => ({}) }),
  });

  await wallet.reconcileDispatches('acad_1', { apikey: 'key', userid: 'uid' });
  assert.ok(spy.entries.some(e => e.level === 'error' && e.tag === '[Aligo] api_http_error'));
  assert.ok(spy.entries.some(e => e.level === 'error' && e.tag === '[Aligo] reconcile_exception'));
});

test('services.ts 발송·중복차단·통계조회는 시크릿 없이 구조화 로그를 남기고 응답 메타를 반환한다', async () => {
  const spy = createLogSpy();
  const policy = loadTs('lib/billing-policy.ts');
  const dispatchView = loadTs('lib/dispatch-view.ts');
  const env = {
    ALIGO_ENABLED: 'true',
    ALIGO_API_KEY: 'secret-api-key',
    ALIGO_USER_ID: 'secret-user',
    ALIGO_SENDER_KEY: 'secret-sender-key',
    ALIGO_SENDER: '01000001111',
    ALIGO_TEMPLATE_CODE: 'UN_5524',
  };
  let record = null;
  let capturedCutoff = null;
  const db = {
    academy: {
      findUnique: async () => ({ id: 'a1', code: 'AC1', name: '루크러닝', kakaoBalance: 50000 }),
      updateMany: async () => ({ count: 1 }),
    },
    classGroup: { findUnique: async () => ({ name: 'A Class' }) },
    kakaoLedger: { create: async () => ({}) },
    quizAttempt: {
      findFirst: async () => ({
        id: 'attempt_1',
        completedAt: new Date('2026-11-13T05:00:00Z'),
        bookId: 'b1',
        member: { id: 'm1', name: '박진호', parentName: '김태환', parentPhone: '01084349832', reportYn: true, academyId: 'a1', classGroupId: 'c1' },
      }),
    },
    book: { findFirst: async () => ({ title: '긴긴밤' }) },
    aligoDispatchLog: {
      findMany: async q => {
        if (q?.where?.OR?.[1]?.checkedAt?.lt) capturedCutoff = q.where.OR[1].checkedAt.lt;
        return record ? [record] : [];
      },
      findUnique: async () => record,
      create: async ({ data }) => { record = { ...data, sentAt: new Date(), academy: { code: 'AC1', name: '루크러닝' } }; return record; },
      count: async () => (record ? 1 : 0),
      update: async ({ data }) => Object.assign(record, data),
      updateMany: async ({ data }) => { Object.assign(record, data); return { count: 1 }; },
    },
    $transaction: fn => fn(db),
  };

  const wallet = loadTs('lib/kakao-wallet.ts', {
    './prisma': { prisma: db },
    './portal-http': { need },
    './billing-policy': policy,
    undici: { ProxyAgent: class {} },
  }, { console: spy.logger, fetch: async () => ({ ok: true, status: 200, json: async () => ({ code: 0, list: { ALT_CNT: 100 }, message: 'OK' }) }) });

  const handler = loadTs('api/services.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/dispatch-view': dispatchView,
    '../lib/billing-policy': policy,
    '../lib/kakao-wallet': wallet,
    '../lib/portal-http': {
      need,
      authenticate: async () => ({ id: 'u1', role: 'DIRECTOR', academyId: 'a1' }),
      staff: () => {},
      failure: (res, e) => res.status(e.status || 500).json({ error: e.message }),
    },
    undici: { ProxyAgent: class {} },
  }, {
    console: spy.logger,
    process: { env },
    fetch: async url => {
      if (String(url).includes('heartinfo')) {
        return { ok: true, status: 200, json: async () => ({ code: 0, message: '정상', list: { ALT_CNT: 99 } }) };
      }
      return { ok: true, status: 200, json: async () => ({ code: 0, message: '성공적으로 전송요청 하였습니다.', info: { mid: '1503785807' } }) };
    },
  }).default;

  const mkRes = () => ({ code: 200, setHeader() {}, status(n) { this.code = n; return this; }, json(v) { this.body = v; return this; } });

  const pvRes = mkRes();
  await handler({ method: 'POST', headers: { host: 'www.nanosbook.co.kr' }, query: {}, body: { type: 'quiz', action: 'preview', logId: 'attempt_1' } }, pvRes);
  assert.equal(pvRes.code, 200);

  const sendRes = mkRes();
  await handler({ method: 'POST', headers: { host: 'www.nanosbook.co.kr' }, query: {}, body: { type: 'quiz', action: 'send', logId: 'attempt_1', fingerprint: pvRes.body.fingerprint } }, sendRes);
  assert.equal(sendRes.code, 200);
  assert.equal(sendRes.body.status, 'ACCEPTED');
  assert.equal(sendRes.body.providerId, '1503785807');

  const dupRes = mkRes();
  await handler({ method: 'POST', headers: { host: 'www.nanosbook.co.kr' }, query: {}, body: { type: 'quiz', action: 'send', logId: 'attempt_1', fingerprint: pvRes.body.fingerprint } }, dupRes);
  assert.equal(dupRes.body.duplicate, true);
  assert.equal(dupRes.body.providerId, '1503785807');

  const statsRes = mkRes();
  await handler({ method: 'GET', headers: { host: 'www.nanosbook.co.kr' }, query: { action: 'dispatch_stats', refresh: '1' } }, statsRes);
  assert.equal(statsRes.code, 200);
  assert.ok(Date.now() - capturedCutoff.getTime() < 10000);

  const dump = JSON.stringify(spy.entries);
  assert.equal(dump.includes('secret-api-key'), false);
  assert.equal(dump.includes('secret-sender-key'), false);
  assert.equal(dump.includes('01084349832'), false);
  assert.ok(spy.entries.some(e => e.tag === '[Aligo] send_request'));
  assert.ok(spy.entries.some(e => e.tag === '[Aligo] send_response'));
  assert.ok(spy.entries.some(e => e.tag === '[Aligo] duplicate_skipped'));
  assert.ok(spy.entries.some(e => e.tag === '[Aligo] dispatch_stats'));
});

test('프론트엔드 알림톡 피드백·대기실패 표시·HTML 무결성이 정상 동작한다', () => {
  const adminJs = fs.readFileSync(path.join(root, 'public_html/admin_preview.js'), 'utf8');
  const start = adminJs.indexOf('function buildKakaoDispatchFeedback');
  const end = adminJs.indexOf('async function sendLearningReportKakao');
  assert.ok(start > -1 && end > start);
  const ctx = {};
  vm.runInNewContext(adminJs.slice(start, end), ctx);

  assert.match(ctx.buildKakaoDispatchFeedback({ status: 'ACCEPTED' }, '북퀴즈 결과'), /알리고에 접수/);
  assert.match(ctx.buildKakaoDispatchFeedback({ status: 'ACCEPTED', duplicate: true }, '북퀴즈 결과'), /이미 발송 접수된/);
  assert.match(ctx.buildKakaoDispatchFeedback({ status: 'FAILED', duplicate: true, resultMessage: '템플릿 불일치' }, '북퀴즈 결과'), /템플릿 불일치/);
  assert.match(ctx.buildKakaoDispatchFeedback({ status: 'FAILED', resultMessage: '발신번호 미등록' }, '북퀴즈 결과'), /발신번호 미등록/);

  const adminHtml = fs.readFileSync(path.join(root, 'public_html/admin_preview.html'), 'utf8');
  assert.equal(adminHtml.includes('truncated for diff preview'), false);
  assert.match(adminHtml, /<\/html>\s*$/);
  assert.match(adminHtml, /billing-ui\.js\?v=20261113_kakao_log/);
});

