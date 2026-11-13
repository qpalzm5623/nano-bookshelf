const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, modules = {}) {
  if (/^api\/(portal|bootstrap|manage)\.ts$/.test(file)) modules = { '../lib/portal-content': require('./test-portal-content.cjs')(modules['../lib/portal-http']), ...modules };
  const code = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const transpiled = ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const fn = new Function('require', 'exports', 'module', transpiled);
  const mod = { exports: {} };
  const customRequire = id => {
    if (modules[id]) return modules[id];
    return require(id);
  };
  fn(customRequire, mod.exports, mod);
  return mod.exports;
}

function response() {
  return {
    code: 200,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.code = c; return this; },
    json(d) { this.data = d; return this; },
    send(d) { this.data = d; return this; }
  };
}

const auth = load('lib/portal-auth.ts');
const secret = 'nano-bookshelf-portal-auth-secret-test-32bytes';
process.env.PORTAL_AUTH_SECRET = secret;
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

test('학원 및 학생 계정은 다른 기기에서 로그인 시 중복 로그인 확인을 요구하고, 승인 시 이전 접속을 종료시킨다', async () => {
  const settings = new Map();
  const studentPw = auth.hashPassword('student123!');
  const student = {
    id: 'student-id-1',
    username: 'std01',
    name: '김학생',
    password: studentPw,
    role: 'STUDENT',
    status: 'APPROVED',
    academyId: 'acad-1',
    academy: { code: 'A1', name: '나노학원', status: 'ACTIVE', deletedAt: null },
    classGroup: { name: '초등반' }
  };

  const db = {
    member: {
      findUnique: async ({ where }) => {
        if (where.username === 'std01' || where.id === 'student-id-1') return student;
        return null;
      },
      update: async () => student
    },
    portalSetting: {
      findUnique: async ({ where }) => {
        const row = settings.get(where.key);
        return row ? { key: where.key, value: row } : null;
      },
      upsert: async ({ where, create, update }) => {
        const val = settings.has(where.key) ? update.value : create.value;
        settings.set(where.key, val);
        return { key: where.key, value: val };
      },
      deleteMany: async ({ where }) => {
        settings.delete(where.key);
        return { count: 1 };
      }
    }
  };

  const http = load('lib/portal-http.ts', {
    './prisma': { prisma: db },
    './portal-auth': auth
  });

  const portalHandler = load('api/portal.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-auth': auth,
    '../lib/portal-http': http,
    '../lib/portal-learning': {}
  }).default;

  // 1. 기기 A에서 첫 로그인 -> 정상 200 성공 및 쿠키 발급
  const resA = response();
  await portalHandler({
    method: 'POST',
    query: { action: 'login' },
    headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
    body: { username: 'std01', password: 'student123!' }
  }, resA);

  assert.equal(resA.code, 200);
  assert.equal(resA.data.user.id, 'std01');
  const cookieA = resA.headers['Set-Cookie'];
  assert.ok(cookieA);
  const tokenA = cookieA.split(';')[0].replace('nano_portal=', '');

  // 기기 A의 세션 검증 (authenticate) -> 정상 작동
  const userA = await http.authenticate({
    method: 'GET',
    headers: { cookie: `nano_portal=${tokenA}` }
  });
  assert.equal(userA.id, 'student-id-1');

  // 2. 기기 B에서 동일 계정으로 로그인 시도 (confirmConcurrent 없음)
  // -> 409 Conflict 발생 및 안내 메시지 확인
  const resB1 = response();
  await portalHandler({
    method: 'POST',
    query: { action: 'login' },
    headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
    body: { username: 'std01', password: 'student123!' }
  }, resB1);

  assert.equal(resB1.code, 409);
  assert.equal(resB1.data.conflict, true);
  assert.equal(resB1.data.concurrentLogin, true);
  assert.equal(resB1.data.error, '현재 다른 기기에서 사용 중입니다. 기존 접속을 종료하고 로그인하시겠습니까?');

  // 3. 기기 B에서 confirmConcurrent: true로 강제 로그인 승인
  // -> 200 OK 성공 및 새 쿠키 발급
  const resB2 = response();
  await portalHandler({
    method: 'POST',
    query: { action: 'login' },
    headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
    body: { username: 'std01', password: 'student123!', confirmConcurrent: true }
  }, resB2);

  assert.equal(resB2.code, 200);
  const cookieB = resB2.headers['Set-Cookie'];
  assert.ok(cookieB);
  const tokenB = cookieB.split(';')[0].replace('nano_portal=', '');

  // 4. 이제 이전 기기 A에서 세션 검증 시 -> 401 Unauthorized 에러 발생!
  await assert.rejects(async () => {
    await http.authenticate({
      method: 'GET',
      headers: { cookie: `nano_portal=${tokenA}` }
    });
  }, (err) => {
    assert.equal(err.status, 401);
    assert.equal(err.message, '다른 기기에서 로그인하여 현재 접속이 종료되었습니다.');
    return true;
  });

  // 5. 새 기기 B의 세션 검증은 200 정상 작동!
  const userB = await http.authenticate({
    method: 'GET',
    headers: { cookie: `nano_portal=${tokenB}` }
  });
  assert.equal(userB.id, 'student-id-1');
});

test('MASTER(본사 관리자) 계정은 여러 기기에서 동시 로그인이 허용된다', async () => {
  const masterPw = auth.hashPassword('master123!');
  const masterMember = {
    id: 'master-id',
    username: 'master',
    name: '본사관리자',
    password: masterPw,
    role: 'MASTER',
    status: 'APPROVED',
    academyId: 'master-acad',
    academy: { code: 'MASTER', name: '본사', status: 'ACTIVE', deletedAt: null }
  };

  const db = {
    member: {
      findUnique: async () => masterMember,
      update: async () => masterMember
    },
    portalSetting: {
      findUnique: async () => null,
      upsert: async () => assert.fail('MASTER 계정은 세션 제한 설정을 건드리지 않아야 함')
    }
  };

  const http = load('lib/portal-http.ts', {
    './prisma': { prisma: db },
    './portal-auth': auth
  });

  const portalHandler = load('api/portal.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-auth': auth,
    '../lib/portal-http': http,
    '../lib/portal-learning': {}
  }).default;

  // 기기 1 로그인
  const res1 = response();
  await portalHandler({
    method: 'POST',
    query: { action: 'login' },
    headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
    body: { username: 'master', password: 'master123!' }
  }, res1);
  assert.equal(res1.code, 200);
  const token1 = res1.headers['Set-Cookie'].split(';')[0].replace('nano_portal=', '');

  // 기기 2 로그인 (중복 확인창 없이 바로 200 성공)
  const res2 = response();
  await portalHandler({
    method: 'POST',
    query: { action: 'login' },
    headers: { host: 'localhost', origin: 'http://localhost', 'content-type': 'application/json' },
    body: { username: 'master', password: 'master123!' }
  }, res2);
  assert.equal(res2.code, 200);
  const token2 = res2.headers['Set-Cookie'].split(';')[0].replace('nano_portal=', '');

  // 두 기기 모두 정상 세션 유지
  const u1 = await http.authenticate({ method: 'GET', headers: { cookie: `nano_portal=${token1}` } });
  const u2 = await http.authenticate({ method: 'GET', headers: { cookie: `nano_portal=${token2}` } });
  assert.equal(u1.id, 'master-id');
  assert.equal(u2.id, 'master-id');
});
