// 실제 화면 코드와 API를 실행하되 운영 DB·외부 발송은 사용하지 않는다.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const seed = JSON.parse(read('lib/literacy-item-bank.json'));
function load(file, deps = {}) {
  const exports = {};
  const code = ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  // 같은 realm에서 실행해 기존 엔진 테스트의 deepStrictEqual도 그대로 검증한다.
  new Function('exports', 'require', 'process', code)(exports, name => deps[name] || require(name),
    { env: { PORTAL_AUTH_SECRET: 'literacy-test-only-secret-32-characters' } });
  return exports;
}
const engine = load('lib/literacy-engine.ts');
load('scripts/literacy-engine.test.ts', { '../lib/literacy-engine': engine, '../lib/literacy-item-bank.json': seed });

test('관리자 전체 스크립트 문법과 문해력 탭 전환·빈 목록·오류 복구', async () => {
  const source = read('public_html/admin_preview.js');
  new vm.Script(source);
  const elements = new Map();
  const el = id => {
    if (!elements.has(id)) elements.set(id, { innerHTML: '', value: id.includes('Filter') ? 'ALL' : '', style: {}, classList: { add() {}, remove() {} } });
    return elements.get(id);
  };
  let fail = false;
  const ctx = vm.createContext({ document: { getElementById: el, querySelector: () => null },
    URLSearchParams, AbortSignal, fetch: async () => ({ ok: !fail, json: async () => fail ? { error: '연결 실패' } : { items: [] } }),
    scrollTo() {}, setTimeout });
  ctx.window = ctx;
  for (const file of ['literacy-common', 'literacy-admin']) vm.runInContext(read('public_html/js/literacy/' + file + '.js'), ctx);
  const ast = ts.createSourceFile('admin.js', source, ts.ScriptTarget.Latest, true);
  const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === 'switchTab');
  vm.runInContext(fn.getText(ast), ctx);
  ctx.switchTab('literacy');
  assert.equal(el('view-literacy').style.display, 'block');
  assert.match(el('view-literacy').innerHTML, /테스트 부여/);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(el('litTableBody').innerHTML, /배정된 문해력 테스트가 없습니다/);
  fail = true;
  await ctx.NanoLiteracyAdmin.refresh();
  assert.match(el('litTableBody').innerHTML, /연결 실패/);
  fail = false;
  await ctx.NanoLiteracyAdmin.refresh();
  assert.match(el('litTableBody').innerHTML, /배정된 문해력 테스트가 없습니다/);
  delete ctx.NanoLiteracyAdmin;
  ctx.switchTab('literacy');
  assert.match(el('view-literacy').innerHTML, /새로고침/);
});

function fixture() {
  let rows = new Map(), failResult = false;
  const student = { id: 'student-001', name: '검증 원생', username: 'test-student', grade: '초등 1학년', role: 'STUDENT', status: 'APPROVED', academyId: 'academy-a', classGroup: { name: '검증반' } };
  let user = { ...student, id: 'director-001', role: 'DIRECTOR', academy: { code: 'A' } };
  const db = {
    member: { findMany: async () => [student] },
    portalSetting: {
      upsert: async ({ where, create }) => {
        if (!rows.has(where.key)) rows.set(where.key, { revision: 1, ...structuredClone(create) });
        return rows.get(where.key);
      },
      findUnique: async ({ where }) => structuredClone(rows.get(where.key) || null),
      findMany: async ({ where }) => [...rows.values()].filter(r => r.scope === where.scope && (!where.value || r.value.memberId === where.value.equals)),
      create: async ({ data }) => {
        if (failResult && data.key.startsWith('literacy_result:')) throw new Error('TEST_WRITE_FAILURE');
        const row = { revision: 1, ...structuredClone(data) }; rows.set(data.key, row); return row;
      },
      updateMany: async ({ where, data }) => {
        const row = rows.get(where.key);
        if (!row || row.revision !== where.revision) return { count: 0 };
        rows.set(where.key, { ...row, value: structuredClone(data.value), revision: row.revision + 1 }); return { count: 1 };
      }
    },
    $transaction: async fn => { const before = structuredClone(rows); try { return await fn(db); } catch (e) { rows = before; throw e; } }
  };
  const http = load('lib/portal-http.ts', { './prisma': { prisma: db }, './portal-auth': {} });
  const handler = load('api/literacy.ts', { '../lib/prisma': { prisma: db }, '../lib/portal-http': { ...http, authenticate: async () => user },
    '../lib/literacy-engine': engine, '../lib/literacy-item-bank.json': seed, undici: { ProxyAgent: class {} } }).default;
  return {
    student, as(role, academyId = 'academy-a') { user = { ...student, role, academyId, academy: { code: 'A' } }; },
    failResult(on) { failResult = on; },
    async call(action, body, params = {}) {
      const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; }, send(data) { this.data = data; return this; } };
      await handler({ query: { action, ...params }, body, method: body ? 'POST' : 'GET', headers: { host: 'test.example' } }, res);
      return res;
    }
  };
}

test('배정 → 학생 출제 → 채점 → 관리자 결과지·공유 링크, 재제출과 학원 분리', async () => {
  const f = fixture();
  const students = await f.call('students');
  assert.equal(students.data.items[0].band, 1);
  const entry = { memberId: f.student.id, band: 1, gradeStep: 1 };
  const assigned = await f.call('assign', { items: [entry, entry] });
  assert.equal(assigned.data.created.length, 1);
  assert.equal(assigned.data.skipped.length, 1);
  const id = (await f.call('assignments')).data.items[0].id;
  f.as('STUDENT');
  assert.equal((await f.call('my')).data.active[0].id, id);
  const started = await f.call('start', { assignmentId: id });
  assert.equal(started.data.items.length, 25);
  assert.ok(started.data.items.every(i => i.answer === undefined));
  const answers = started.data.items.map(i => ({ itemId: i.id, choice: seed.items.find(s => s.id === i.id).answer, ms: 1000 }));
  assert.equal((await f.call('submit', { assignmentId: id, answers: answers.map(a => ({ ...a, choice: null })) })).code, 400);
  f.failResult(true);
  assert.equal((await f.call('submit', { assignmentId: id, answers })).code, 500);
  assert.equal((await f.call('my')).data.active[0].status, 'IN_PROGRESS');
  f.failResult(false);
  assert.equal((await f.call('submit', { assignmentId: id, answers })).data.score, 100);
  assert.equal((await f.call('submit', { assignmentId: id, answers })).data.score, 100);
  assert.equal((await f.call('my')).data.history.length, 1);
  f.as('DIRECTOR');
  const record = (await f.call('assignments')).data.items[0];
  assert.equal(record.status, 'COMPLETED');
  const report = await f.call('result', undefined, { id: record.resultId });
  assert.equal(report.data.record.result.correct, 25);
  assert.equal(report.data.history.length, 1);
  const link = new URL((await f.call('share_link', undefined, { id: record.resultId })).data.url);
  const shared = await f.call('public_report', undefined, { id: record.resultId, t: link.searchParams.get('t') });
  assert.equal(shared.code, 200);
  assert.equal(shared.data.record.responses, undefined);
  assert.equal((await f.call('public_report', undefined, { id: record.resultId, t: 'invalid' })).code, 403);
  f.as('DIRECTOR', 'other-academy');
  assert.equal((await f.call('assignments')).data.items.length, 0);
  assert.equal((await f.call('result', undefined, { id: record.resultId })).code, 403);
});

test('이미지 업로드 권한·형식 검증과 신규 문항 저장 후 이미지 조회', async () => {
  const f = fixture();
  const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';
  const body = { mime: 'image/png', base64: png };
  assert.equal((await f.call('image_upload', body)).code, 403);
  f.as('MASTER');
  assert.equal((await f.call('image_upload', { ...body, base64: Buffer.from('<svg>invalid</svg>').toString('base64') })).code, 400);
  assert.equal((await f.call('image_upload', { ...body, base64: 'a'.repeat(700001) })).code, 413);
  const uploaded = await f.call('image_upload', body);
  assert.equal(uploaded.code, 200);
  const item = { ...seed.items[0], id: undefined, image: uploaded.data.url };
  const saved = await f.call('bank_save', { revision: 0, item });
  assert.equal(saved.code, 200);
  assert.ok((await f.call('bank')).data.items.some(i => i.id === saved.data.id && i.image === uploaded.data.url));
  f.as('STUDENT');
  const id = new URL(uploaded.data.url, 'https://test.example').searchParams.get('id');
  const image = await f.call('image', undefined, { id });
  assert.equal(image.code, 200);
  assert.equal(image.data.toString('base64'), png);
});

test('문항 이미지와 화면 연결 자산이 존재한다', () => {
  for (const item of seed.items) {
    for (const asset of [item.image, ...(item.choiceImages || [])].filter(Boolean)) {
      if (!asset.startsWith('https:')) assert.ok(fs.existsSync(path.join(root, 'public_html', asset)), asset);
    }
  }
  for (const page of ['admin_preview.html', 'student_preview.html', 'master_preview.html', 'literacy_report.html']) {
    for (const match of read('public_html/' + page).matchAll(/(?:src|href)="([^"?]*(?:literacy)[^"?]*)(?:\?[^"]*)?"/g)) {
      assert.ok(fs.existsSync(path.join(root, 'public_html', match[1])), match[1]);
    }
  }
});
