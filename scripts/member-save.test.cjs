const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function load(file, modules = {}) {
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

const director = {
  id: 'dir1',
  role: 'DIRECTOR',
  academyId: 'academy-1',
  academy: { code: 'A1', id: 'academy-1', maxStudents: 100 }
};

const http = load('lib/portal-http.ts', { './prisma': { prisma: {} }, './portal-auth': {} });
const learning = load('lib/portal-learning.ts');

test('원생 학부모 정보 수정 시 updatedAt이 누락되거나 캐시 시각이 달라도 정상 저장된다', async () => {
  const existingMember = {
    id: 'look1-db-id',
    academyId: 'academy-1',
    username: 'look1',
    name: '박진호',
    role: 'STUDENT',
    status: 'APPROVED',
    grade: '초등 5학년',
    school: '옥천초등학교',
    gender: '남',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    reportYn: true,
    classGroupId: null,
    updatedAt: new Date('2026-10-27T08:00:00.000Z')
  };

  let updatedData = null;
  const db = {
    $transaction: async fn => fn({
      $queryRaw: async () => [],
      member: {
        findFirst: async ({ where }) => {
          if (where.id === 'look1-db-id' || where.username === 'look1') {
            return existingMember;
          }
          return null;
        },
        update: async ({ where, data }) => {
          updatedData = data;
          return { ...existingMember, ...data, updatedAt: new Date('2026-11-11T05:00:00.000Z') };
        },
        findUnique: async () => ({ ...existingMember, ...updatedData, updatedAt: new Date('2026-11-11T05:00:00.000Z') })
      }
    })
  };

  const handler = load('api/manage.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': {
      ...http,
      authenticate: async () => director,
      academyScope: async () => director.academyId
    },
    '../lib/portal-auth': { hashPassword: () => '$testhash' },
    '../lib/portal-learning': learning
  }).default;

  // 1. updatedAt 없이 학부모 정보 저장 요청 (기존에 409 에러가 났던 케이스)
  const res1 = response();
  await handler({
    method: 'POST',
    query: { entity: 'members' },
    body: {
      operation: 'save',
      data: {
        id: 'look1-db-id',
        username: 'look1',
        name: '박진호',
        parentName: '김태민',
        parentPhone: '010-8434-9932',
        grade: '초등 5학년',
        school: '옥천초등학교'
      }
    }
  }, res1);

  assert.equal(res1.code, 200);
  assert.equal(updatedData.parentName, '김태민');
  assert.equal(updatedData.parentPhone, '010-8434-9932');

  // 2. force: true 옵션을 통한 강제 갱신 케이스
  const res2 = response();
  await handler({
    method: 'POST',
    query: { entity: 'members' },
    body: {
      operation: 'save',
      data: {
        username: 'look1',
        name: '박진호',
        parentName: '김태민',
        parentPhone: '010-8434-9932',
        updatedAt: '2020-01-01T00:00:00.000Z', // 오래된 클라이언트 시각
        force: true
      }
    }
  }, res2);

  assert.equal(res2.code, 200);

  // 3. row.id가 없더라도 row.username으로 기존 원생을 찾아 중복생성(500) 대신 update 되는 케이스
  const res3 = response();
  await handler({
    method: 'POST',
    query: { entity: 'members' },
    body: {
      operation: 'save',
      data: {
        username: 'look1',
        name: '박진호',
        parentName: '김태민',
        parentPhone: '010-8434-9932'
      }
    }
  }, res3);

  assert.equal(res3.code, 200);
  assert.equal(updatedData.name, '박진호');
});
