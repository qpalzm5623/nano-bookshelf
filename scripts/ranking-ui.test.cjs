const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public_html/admin_preview.js'), 'utf8');
const ast = ts.createSourceFile('admin.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function ui(names, extra = {}) {
  const ctx = vm.createContext({ NANO_FRIEND_IDS: ['nano', 'toto', 'booki', 'mir'], ...extra }); ctx.window = ctx;
  for (const name of names) {
    const node = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name.text === name);
    vm.runInContext(node.getText(ast), ctx);
  }
  return ctx;
}
test('학생의 저장된 선택을 우선하고 이름·아이디로 캐릭터를 임의 배정하지 않는다', () => {
  const ctx = ui(['getStudentCharacterId'], { NanoPortal: { remote: true }, localStorage: { getItem: () => 'mir' } });
  assert.equal(ctx.getStudentCharacterId({ characterId: 'booki', username: 'look1' }), 'booki');
  assert.equal(ctx.getStudentCharacterId({ name: '박진호', username: 'look1' }), 'nano');
  assert.equal(ctx.getStudentCharacterId({ name: '다른 학생', username: 'different' }), 'nano');
  assert.equal(ctx.getStudentCharacterId({ characterId: 'invalid' }), 'nano');
  ctx.NanoPortal.remote = false;
  assert.equal(ctx.getStudentCharacterId({ username: 'local' }), 'mir');
});
test('학생 서버 ID로 최신 선택·성장 단계를 적용하고 늦은 이전 조회는 무시한다', async () => {
  const pending = [], status = {}, renders = [];
  const ctx = ui(['refreshAdminRankingCharacters'], {
    adminRankCharacterRequest: 0, currentAcademyInfo: { id: 'A' }, document: { getElementById: () => status },
    studentDataList: [{ serverId: 's1', name: '동명' }, { serverId: 's2', name: '동명' }],
    renderAdminRankingView: skip => renders.push(skip),
    NanoPortal: { api: () => new Promise(resolve => pending.push(resolve)) }
  });
  const first = ctx.refreshAdminRankingCharacters(), second = ctx.refreshAdminRankingCharacters();
  pending[1]({ items: [{ memberId: 's2', characterId: 'booki', stage: 2 }, { memberId: 's1', characterId: 'toto', stage: 3 }] }); await second;
  pending[0]({ items: [{ memberId: 's1', characterId: 'mir', stage: 1 }] }); await first;
  assert.equal(ctx.studentDataList[0].characterId, 'toto'); assert.equal(ctx.studentDataList[0].characterStage, 3);
  assert.equal(ctx.studentDataList[1].characterId, 'booki'); assert.deepEqual(renders, [true]);
});
test('학원을 전환한 뒤 도착한 캐릭터 응답은 현재 학생 목록에 적용하지 않는다', async () => {
  let resolve;
  const ctx = ui(['refreshAdminRankingCharacters'], {
    adminRankCharacterRequest: 0, currentAcademyInfo: { id: 'A' }, document: { getElementById: () => ({}) },
    studentDataList: [{ serverId: 's1', characterId: 'nano' }], renderAdminRankingView() { throw Error('stale render'); },
    NanoPortal: { api: () => new Promise(done => { resolve = done; }) }
  });
  const task = ctx.refreshAdminRankingCharacters(); ctx.currentAcademyInfo.id = 'B';
  resolve({ items: [{ memberId: 's1', characterId: 'mir', stage: 3 }] }); await task;
  assert.equal(ctx.studentDataList[0].characterId, 'nano');
});
test('TOP 3 카드는 1~2명도 표시하고 캐릭터 단계·왕관·문자 이스케이프를 유지한다', () => {
  const ctx = ui(['escapeRankingText', 'renderAdminRankingPodium'], { getCharacterSvg: (id, size, stage) => `<svg data-id="${id}" data-stage="${stage}"></svg>` });
  const students = ['nano', 'toto', 'booki'].map((charId, i) => ({ charId, stage: i + 1, name: '<학생>', grade: '초등 3학년', points: 100, books: 4 }));
  for (const count of [0, 1, 2, 3]) {
    const html = ctx.renderAdminRankingPodium(students.slice(0, count));
    assert.equal((html.match(/<article /g) || []).length, count);
    assert.equal((html.match(/class="champion-crown"/g) || []).length, count ? 1 : 0);
    assert.ok(!html.includes('<학생>'));
  }
  assert.match(ctx.renderAdminRankingPodium(students), /data-id="booki" data-stage="3"/);
});
test('랭킹은 월별 독서량으로 캐릭터 단계를 변경하지 않는다', () => {
  const ctx = ui(['getStudentCharacterId', 'buildAdminRankingRows'], {
    NanoPortal: { remote: true }, getLoadedLearningLogs: () => [{ studentId: 'u1', date: '2026-10-01', score: 90 }],
    studentDataList: [{ id: 'u1', name: '학생', characterId: 'booki', characterStage: 3, bookCount: 1, points: 10 }]
  });
  assert.equal(ctx.buildAdminRankingRows('2026-10')[0].stage, 3);
  assert.equal(ctx.buildAdminRankingRows('2026-09')[0].stage, 3);
});

function load(file, deps) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => deps[name] || require(name), console });
  return exports;
}
test('캐릭터 API는 소속 학생의 선택만 조회하고 학생 화면과 같은 성장 규칙을 적용한다', async () => {
  const http = load('lib/portal-http.ts', { './prisma': {}, './portal-auth': {} });
  let user = { role: 'TEACHER', academyId: 'a1' }, lookups = 0;
  const db = {
    member: { findMany: async ({ where }) => { lookups++; assert.equal(where.academyId, 'a1'); assert.equal(where.status, 'APPROVED'); return [{ id: 's1' }, { id: 's2' }]; } },
    portalSetting: { findMany: async ({ where }) => { assert.deepEqual(Array.from(where.key.in), ['character:s1', 'character:s2']); return [{ key: 'character:s1', value: { characterId: 'booki' } }]; } }
  };
  const run = load('api/activity.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-http': { ...http, authenticate: async () => user, academyScope: async (u, code) => { if (code !== 'A') http.master(u); return u.academyId; } },
    '../lib/portal-learning': { readingProgress: async () => new Map([['s1', { natureRead: 100, totalRead: 100 }], ['s2', { totalRead: 30 }]]) }
  }).default;
  const response = () => ({ code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; } });
  const req = { method: 'GET', query: { action: 'characters', academy: 'A' } }, res = response();
  await run(req, res);
  assert.equal(res.code, 200); assert.equal(res.data.items[0].characterId, 'booki'); assert.equal(res.data.items[0].stage, 2);
  assert.equal(res.data.items[1].characterId, 'nano'); assert.equal(res.data.items[1].stage, 2);
  const denied = response(); await run({ ...req, query: { ...req.query, academy: 'OTHER' } }, denied); assert.equal(denied.code, 403);
  user = { ...user, role: 'STUDENT' }; const student = response(); await run(req, student); assert.equal(student.code, 403); assert.equal(lookups, 1);
});
