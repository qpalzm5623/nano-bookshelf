import { prisma } from './prisma';

// 회원 정보 드롭다운과 동일한 공식 학년 단계 (최대 중등 3학년 유지)
export const GRADE_LADDER = [
  '유치부',
  '초등 1학년',
  '초등 2학년',
  '초등 3학년',
  '초등 4학년',
  '초등 5학년',
  '초등 6학년',
  '중등 1학년',
  '중등 2학년',
  '중등 3학년',
] as const;

export const GRADE_PROMOTION_SETTING_KEY = 'annual_grade_promotion_year';
// 기능 도입 연도(2026년)를 기준점으로 두어 2026년 중 배포 시 즉시 진급되지 않고,
// 2027년 1월 1일 00:00 KST부터 매년 1회 자동 진급되도록 보장합니다.
export const GRADE_PROMOTION_BASELINE_YEAR = 2026;

let cachedPromotedYear = GRADE_PROMOTION_BASELINE_YEAR;
let inFlightPromotion: Promise<GradePromotionResult> | null = null;

export interface GradePromotionResult {
  promoted: boolean;
  alreadyPromoted: boolean;
  year: number;
  promotedCount: number;
  skippedCount: number;
  transitions: Record<string, number>;
}

/** UTC 시각을 한국 표준시(KST, UTC+9) 기준 연도로 변환합니다. */
export function getKstYear(now: Date = new Date()): number {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.getUTCFullYear();
}

/** 다양한 표기(초6, 6학년, 초등 6학년, 중1, 유치부 등)를 공식 학년 인덱스로 해석합니다. */
export function resolveGradeIndex(rawGrade?: string | null): number {
  const s = String(rawGrade || '').trim();
  if (!s) return -1;

  const exactIdx = (GRADE_LADDER as readonly string[]).indexOf(s);
  if (exactIdx !== -1) return exactIdx;

  // 원장·교사 등 직급이나 미등록 값은 진급 대상에서 제외합니다.
  if (/원장|교사|선생|관리자|마스터|미등록|선택/.test(s)) return -1;

  if (/유치|유아|미취학|^0$/.test(s)) return 0;

  // 중등 (중1 ~ 중3, 중등 1학년 ~ 중등 3학년)
  const midMatch = s.match(/중(?:등|학교)?\s*([1-3])(?:\s*학년)?/);
  if (midMatch) return 6 + Number(midMatch[1]); // 7, 8, 9

  // 초등 (초1 ~ 초6, 초등 1학년 ~ 초등 6학년, 단독 1학년 ~ 6학년)
  const elemMatch = s.match(/(?:초(?:등|학교)?\s*)?([1-6])(?:\s*학년)?$/);
  if (elemMatch && !/고|중/.test(s)) return Number(elemMatch[1]); // 1..6

  return -1;
}

/** 주어진 학년을 steps년만큼 진급시킨 공식 학년 문자열을 반환합니다. 진급 불가 시 null 반환. */
export function getNextGrade(rawGrade?: string | null, steps: number = 1): string | null {
  if (!Number.isInteger(steps) || steps <= 0) return null;
  const idx = resolveGradeIndex(rawGrade);
  if (idx === -1) return null;

  // 중등 3학년(마지막 단계)은 드롭다운 최대 학년이므로 그대로 유지합니다.
  const nextIdx = Math.min(GRADE_LADDER.length - 1, idx + steps);
  const nextGrade = GRADE_LADDER[nextIdx];
  if (nextGrade === String(rawGrade || '').trim()) return null;
  // 이미 중등 3학년인 경우(표기만 중3 등인 경우도 포함) 더 이상 진급시키지 않습니다.
  if (idx === GRADE_LADDER.length - 1) return null;
  return nextGrade;
}

/** 테스트 등에서 인메모리 연도 캐시를 초기화할 때 사용합니다. */
export function resetGradePromotionCache(year: number = GRADE_PROMOTION_BASELINE_YEAR) {
  cachedPromotedYear = year;
  inFlightPromotion = null;
}

/**
 * 매년 1월 1일 00:00 KST 기점으로 전체 재원/대기/정지 원생(STUDENT)의 학년을 +1 진급합니다.
 * - PostgreSQL 트랜잭션 + pg_advisory_xact_lock + PortalSetting 기록으로 연 1회 멱등 실행을 보장합니다.
 * - 이미 해당 연도 진급이 끝났으면 인메모리 캐시로 즉시 반환(DB 쿼리 0회)합니다.
 */
export async function ensureAnnualGradePromotion(
  options: { now?: Date; db?: any; bypassCache?: boolean } = {}
): Promise<GradePromotionResult> {
  const now = options.now || new Date();
  const db = options.db || prisma;
  const kstYear = getKstYear(now);

  if (!options.bypassCache && cachedPromotedYear >= kstYear) {
    return { promoted: false, alreadyPromoted: true, year: kstYear, promotedCount: 0, skippedCount: 0, transitions: {} };
  }

  const run = async (): Promise<GradePromotionResult> => {
    const result = await db.$transaction(async (tx: any) => {
      // 동시 크론/로그인 요청이 겹쳐도 중복 진급되지 않도록 트랜잭션 범위 락을 획득합니다.
      if (typeof tx.$executeRaw === 'function') {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('annual_grade_promotion'))`;
      }

      const setting = await tx.portalSetting.findUnique({ where: { key: GRADE_PROMOTION_SETTING_KEY } });
      const lastPromotedYear = Number((setting?.value as any)?.year) || GRADE_PROMOTION_BASELINE_YEAR;

      if (lastPromotedYear >= kstYear) {
        return {
          promoted: false,
          alreadyPromoted: true,
          year: kstYear,
          promotedCount: 0,
          skippedCount: 0,
          transitions: {},
          committedYear: lastPromotedYear,
        };
      }

      const yearsToAdvance = kstYear - lastPromotedYear;
      const students = await tx.member.findMany({
        where: {
          role: 'STUDENT',
          status: { not: 'WITHDRAWN' },
          grade: { not: null },
        },
        select: { id: true, grade: true },
      });

      // 대상 학년별로 ID를 묶어 최대 9번의 배치 updateMany로 빠르게 반영합니다.
      const idsByNextGrade = new Map<string, string[]>();
      const transitions: Record<string, number> = {};
      let promotedCount = 0;
      let skippedCount = 0;

      for (const student of students) {
        const nextGrade = getNextGrade(student.grade, yearsToAdvance);
        if (!nextGrade) {
          skippedCount++;
          continue;
        }
        const bucket = idsByNextGrade.get(nextGrade) || [];
        bucket.push(student.id);
        idsByNextGrade.set(nextGrade, bucket);

        const key = `${String(student.grade).trim()} -> ${nextGrade}`;
        transitions[key] = (transitions[key] || 0) + 1;
        promotedCount++;
      }

      for (const [nextGrade, ids] of idsByNextGrade.entries()) {
        await tx.member.updateMany({
          where: { id: { in: ids } },
          data: { grade: nextGrade },
        });
      }

      const recordValue = {
        year: kstYear,
        previousYear: lastPromotedYear,
        yearsAdvanced: yearsToAdvance,
        promotedAt: now.toISOString(),
        promotedCount,
        skippedCount,
        transitions,
      };

      await tx.portalSetting.upsert({
        where: { key: GRADE_PROMOTION_SETTING_KEY },
        create: { key: GRADE_PROMOTION_SETTING_KEY, scope: 'system', value: recordValue },
        update: { value: recordValue },
      });

      return {
        promoted: true,
        alreadyPromoted: false,
        year: kstYear,
        promotedCount,
        skippedCount,
        transitions,
        committedYear: kstYear,
      };
    });

    if (!options.bypassCache) {
      cachedPromotedYear = Math.max(cachedPromotedYear, result.committedYear);
    }

    return {
      promoted: result.promoted,
      alreadyPromoted: result.alreadyPromoted,
      year: result.year,
      promotedCount: result.promotedCount,
      skippedCount: result.skippedCount,
      transitions: result.transitions,
    };
  };

  if (options.bypassCache) return run();
  if (!inFlightPromotion) {
    inFlightPromotion = run().finally(() => {
      inFlightPromotion = null;
    });
  }
  return inFlightPromotion;
}
