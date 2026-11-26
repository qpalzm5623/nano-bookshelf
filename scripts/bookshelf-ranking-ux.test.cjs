const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'public_html/student_preview.html'), 'utf8');

function extractFn(name) {
  const re = new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`);
  const m = html.match(re);
  assert.ok(m, `${name} 함수가 student_preview.html에 존재해야 합니다`);
  return m[0];
}

test('포인트 내역 제목 정제 함수는 괄호 안내·중복 활동명을 제거하고 순수 도서명만 남긴다', () => {
  const ctx = vm.createContext({});
  vm.runInContext(extractFn('cleanPointLogTitle') + '\n' + extractFn('escapeStudentQuizText') + '\n' + extractFn('createPointLogItemHtml'), ctx);

  assert.equal(
    ctx.cleanPointLogTitle('알콰리즈미가 들려주는 이차방정식 이야기 생각담기 작성 (1회차 · 초4이상 20% 가중)'),
    '알콰리즈미가 들려주는 이차방정식 이야기'
  );
  assert.equal(
    ctx.cleanPointLogTitle('알콰리즈미가 들려주는 이차방정식 이야기 북퀴즈 인증 완료 (1회차 · 정답 2개 × 3P · 초4이상 20% 가중)'),
    '알콰리즈미가 들려주는 이차방정식 이야기'
  );
  assert.equal(
    ctx.cleanPointLogTitle('돈과 금융 좀 아는 10대 생각담기 작성 (1회차 · 초4이상 20% 가중)'),
    '돈과 금융 좀 아는 10대'
  );
  assert.equal(ctx.cleanPointLogTitle('출석 보너스'), '출석 보너스');

  const cardHtml = ctx.createPointLogItemHtml({
    datetime: '2026-11-25 15:58',
    type: 'think',
    typeName: '생각담기',
    bookTitle: '돈과 금융 좀 아는 10대 생각담기 작성 (1회차 · 초4이상 20% 가중)',
    activity: '생각담기 적립',
    point: 6
  });
  assert.ok(cardHtml.includes('2026-11-25 15:58'));
  assert.ok(cardHtml.includes('돈과 금융 좀 아는 10대'));
  assert.ok(cardHtml.includes('+6'));
  assert.equal(cardHtml.includes('생각담기 적립'), false, '하단 중복 활동 텍스트가 제거되어야 합니다');
  assert.equal(cardHtml.includes('20% 가중'), false, '괄호 가중 안내 텍스트가 제거되어야 합니다');
});

test('포인트 정책 패널은 기본 숨김 상태이고 우측 포인트 정책 버튼 클릭으로 토글된다', () => {
  assert.ok(html.includes('id="btnPointPolicyToggle"'));
  assert.ok(html.includes('id="pointPolicyCollapseBox" class="point-policy-panel" style="display:none;"'));
});

test('api/activity.ts는 aroundMe=1 및 fromRank/toRank 양방향 랭킹 구간 조회를 지원한다', async () => {
  const src = fs.readFileSync(path.join(root, 'api/activity.ts'), 'utf8');
  const transpile = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    reportDiagnostics: true
  });
  assert.equal((transpile.diagnostics || []).length, 0);

  function load(relPath, deps = {}) {
    const code = ts.transpileModule(fs.readFileSync(path.join(root, relPath), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
    }).outputText;
    const mod = { exports: {} };
    new Function('exports', 'module', 'require', code)(mod.exports, mod, n => deps[n] || require(n));
    return mod.exports;
  }

  const brand = require('./test-portal-brand.cjs')({});
  const http = load('lib/portal-http.ts', { './prisma': {}, './portal-auth': {}, './portal-brand': brand });
  const learning = load('lib/portal-learning.ts', {});
  const user = { id: 'stu-50', role: 'STUDENT', academyId: 'a1', classGroupId: 'c1', points: 500, academy: { name: '나노학원' }, classGroup: { name: 'A반' } };
  const all100 = Array.from({ length: 100 }, (_, i) => ({
    id: `stu-${i + 1}`,
    name: `학생${i + 1}`,
    username: `user${String(i + 1).padStart(3, '0')}`,
    points: 1000 - i * 5,
    academyName: '나노학원',
    className: 'A반',
    amount: 1000 - i * 5,
    books: 10,
    rank: i + 1,
    participants: 100
  }));

  const db = {
    $queryRaw: async (strings, ...values) => {
      const sql = strings.join(' ? ');
      if (sql.includes('me_pos')) {
        return all100.filter(r => r.rank <= 3 || (r.rank >= 40 && r.rank <= 60));
      }
      if (sql.includes('rank >=') && sql.includes('rank <=')) {
        const from = values[values.length - 2];
        const to = values[values.length - 1];
        return all100.filter(r => r.rank >= from && r.rank <= to);
      }
      return all100;
    },
    portalSetting: { findMany: async () => [] }
  };

  const run = load('api/activity.ts', {
    '../lib/prisma': { prisma: db },
    '../lib/portal-brand': brand,
    '../lib/portal-http': { ...http, authenticate: async () => user },
    '../lib/portal-learning': { ...learning, readingProgress: async (_db, ids) => new Map(ids.map(id => [id, { totalRead: 10 }])) }
  }).default;

  const mkRes = () => ({ code: 200, setHeader() {}, status(c) { this.code = c; return this; }, json(d) { this.data = d; } });

  // 1) aroundMe=1 (50등 중심 40~60등 + 포디움 top3 반환)
  const r1 = mkRes();
  await run({ method: 'GET', query: { action: 'rankings', scope: 'national', period: 'month', aroundMe: '1', halfWindow: '10' } }, r1);
  assert.equal(r1.code, 200);
  assert.equal(r1.data.myRank, 50);
  assert.equal(r1.data.top3.length, 3);
  assert.equal(r1.data.windowStart, 40);
  assert.equal(r1.data.windowEnd, 60);
  assert.equal(r1.data.rows.length, 21);
  assert.equal(r1.data.rows.find(r => r.me).rank, 50);

  // 2) 위로 스크롤: fromRank=20&toRank=39
  const r2 = mkRes();
  await run({ method: 'GET', query: { action: 'rankings', scope: 'national', period: 'month', fromRank: '20', toRank: '39' } }, r2);
  assert.equal(r2.code, 200);
  assert.equal(r2.data.windowStart, 20);
  assert.equal(r2.data.windowEnd, 39);
  assert.equal(r2.data.rows.length, 20);
});
