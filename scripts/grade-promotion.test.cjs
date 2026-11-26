const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadTs(relPath, deps = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relPath), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  new Function('exports', 'module', 'require', code)(mod.exports, mod, (name) => deps[name] || require(name));
  return mod.exports;
}

const gp = loadTs('lib/grade-promotion.ts', { './prisma': { prisma: {} } });

test('학년 +1 변환은 초등 6학년 → 중등 1학년을 포함해 모든 단계를 정확히 진급시키고 중등 3학년은 유지한다', () => {
  assert.equal(gp.getNextGrade('유치부'), '초등 1학년');
  assert.equal(gp.getNextGrade('초등 1학년'), '초등 2학년');
  assert.equal(gp.getNextGrade('초등 5학년'), '초등 6학년');
  assert.equal(gp.getNextGrade('초등 6학년'), '중등 1학년');
  assert.equal(gp.getNextGrade('중등 1학년'), '중등 2학년');
  assert.equal(gp.getNextGrade('중등 2학년'), '중등 3학년');
  // 최대 학년(중등 3학년) 유지
  assert.equal(gp.getNextGrade('중등 3학년'), null);
  // 축약 표기 호환
  assert.equal(gp.getNextGrade('초6'), '중등 1학년');
  assert.equal(gp.getNextGrade('중1'), '중등 2학년');
  // 비대상(직급·미등록·빈값) 무시
  assert.equal(gp.getNextGrade('원장'), null);
  assert.equal(gp.getNextGrade('교사'), null);
  assert.equal(gp.getNextGrade(''), null);
  assert.equal(gp.getNextGrade(null), null);
});

test('KST 1월 1일 00:00 기점으로만 연 1회 멱등 진급되며 원장·교사·퇴원생은 제외된다', async () => {
  const members = [
    { id: 's1', role: 'STUDENT', status: 'APPROVED', grade: '초등 6학년' },
    { id: 's2', role: 'STUDENT', status: 'APPROVED', grade: '유치부' },
    { id: 's3', role: 'STUDENT', status: 'APPROVED', grade: '중등 3학년' },
    { id: 's4', role: 'STUDENT', status: 'WITHDRAWN', grade: '초등 3학년' },
    { id: 'd1', role: 'DIRECTOR', status: 'APPROVED', grade: '원장' },
  ];
  const settings = new Map();

  const db = {
    $transaction: async (fn) => fn(db),
    $executeRaw: async () => 1,
    portalSetting: {
      findUnique: async ({ where }) => settings.get(where.key) || null,
      upsert: async ({ where, create, update }) => {
        const next = settings.has(where.key) ? { ...settings.get(where.key), ...update } : create;
        settings.set(where.key, next);
        return next;
      },
    },
    member: {
      findMany: async ({ where }) => members.filter((m) =>
        m.role === where.role &&
        m.status !== where.status.not &&
        m.grade != null
      ),
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const m of members) {
          if (where.id.in.includes(m.id)) {
            m.grade = data.grade;
            count++;
          }
        }
        return { count };
      },
    },
  };

  gp.resetGradePromotionCache(2026);

  // 1) 2026-12-31 23:59:59 KST (= 2026-12-31T14:59:59Z) -> 진급 안 됨
  const beforeMidnight = await gp.ensureAnnualGradePromotion({ now: new Date('2026-12-31T14:59:59Z'), db });
  assert.equal(beforeMidnight.promoted, false);
  assert.equal(members[0].grade, '초등 6학년');

  // 2) 2027-01-01 00:00:00 KST (= 2026-12-31T15:00:00Z) -> 즉시 +1 진급!
  const atMidnight = await gp.ensureAnnualGradePromotion({ now: new Date('2026-12-31T15:00:00Z'), db });
  assert.equal(atMidnight.promoted, true);
  assert.equal(atMidnight.year, 2027);
  assert.equal(atMidnight.promotedCount, 2);
  assert.equal(members[0].grade, '중등 1학년'); // 초등 6학년 -> 중등 1학년
  assert.equal(members[1].grade, '초등 1학년'); // 유치부 -> 초등 1학년
  assert.equal(members[2].grade, '중등 3학년'); // 중등 3학년 유지
  assert.equal(members[3].grade, '초등 3학년'); // WITHDRAWN 유지
  assert.equal(members[4].grade, '원장'); // DIRECTOR 유지

  // 3) 같은 해 재실행(bypassCache 포함) -> 중복 진급 차단 (멱등성)
  const duplicate = await gp.ensureAnnualGradePromotion({ now: new Date('2027-01-01T00:05:00Z'), db, bypassCache: true });
  assert.equal(duplicate.promoted, false);
  assert.equal(duplicate.alreadyPromoted, true);
  assert.equal(members[0].grade, '중등 1학년');

  // 4) 다음 해 2028-01-01 00:00:00 KST -> 다시 +1 진급
  const nextYear = await gp.ensureAnnualGradePromotion({ now: new Date('2027-12-31T15:00:00Z'), db });
  assert.equal(nextYear.promoted, true);
  assert.equal(nextYear.year, 2028);
  assert.equal(members[0].grade, '중등 2학년');
  assert.equal(members[1].grade, '초등 2학년');
});

test('vercel.json에 매년 1월 1일 00:00 KST(UTC 12/31 15:00) 크론이 등록되어 있다', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const cron = (vercel.crons || []).find((c) => c.path === '/api/grade-promotion');
  assert.ok(cron, '/api/grade-promotion 크론 등록 확인');
  assert.equal(cron.schedule, '0 15 31 12 *');
});
