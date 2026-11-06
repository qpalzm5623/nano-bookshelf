// ==============================================================
// 나노의책장 - 현행 포인트 적립 기준 전 기간 학습이력 일괄 재산정 엔진
// ==============================================================
// [현행 포인트 적립 정책 (lib/portal-learning.ts 동일 기준)]
//  1. 북퀴즈 점수 60점 이상 인증 완료 건에 한해서만 포인트 지급 (60점 미만 0P)
//  2. 동일 학생이 동일 도서 인증 시 시간순 최초 2회차까지만 포인트 지급 (3회차부터 0P)
//  3. 정답 문항 수 × 3P 지급 (권장학년 초4 이상 도서는 × 1.2 가중치 후 반올림)
//  4. 주관식 생각담기(thinkReply) 작성 시 +5P 추가 (초4 이상 도서는 × 1.2 = +6P)
//  5. PointHistory.createdAt은 실제 응시 완료 시각(completedAt) 그대로 기록하여
//     지난달·지지난달·연간·기간지정 랭킹 및 월별 포인트 내역에 100% 정확히 반영
//  6. 원장/교사가 수동 부여한 포인트(pointType='MANUAL')는 삭제하지 않고 안전 보존
// ==============================================================

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Role } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { isGrade4OrAbove } from '../lib/portal-learning';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function recalculatePointsByCurrentPolicy(options: { dryRun?: boolean } = {}): Promise<{
  totalAttempts: number;
  certifiedAwardedAttempts: number;
  pointHistoryRows: number;
  totalPointsAwarded: number;
}> {
  const dryRun = options.dryRun ?? process.argv.includes('--dry-run');

  console.log('\n🪙 =============================================================');
  console.log(`🪙 [포인트 정밀 산정] 현행 적립 기준으로 전 기간 학습 포인트 재계산 시작 (DRY_RUN=${dryRun})`);
  console.log('🪙 =============================================================');

  const [books, attempts] = await Promise.all([
    prisma.book.findMany({
      select: { id: true, title: true, grade: true, level: true, recommendGrade: true },
    }),
    prisma.quizAttempt.findMany({
      orderBy: [{ completedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        memberId: true,
        bookId: true,
        score: true,
        correctCount: true,
        questionCount: true,
        thinkReply: true,
        answers: true,
        completedAt: true,
      },
    }),
  ]);

  const bookMap = new Map(books.map((b) => [b.id, b]));
  const certRoundMap = new Map<string, number>(); // `${memberId}:${bookId}` -> 누적 인증 회차

  const newPointHistories: Array<{
    id: string;
    memberId: string;
    amount: number;
    pointType: string;
    content: string;
    createdAt: Date;
  }> = [];

  const attemptEarnedUpdates: Array<{ id: string; earned: number }> = [];
  let certifiedAwardedAttempts = 0;
  let totalPointsAwarded = 0;

  for (const att of attempts) {
    const isCertified = att.score >= 60;
    let earned = 0;

    if (isCertified) {
      const mbKey = `${att.memberId}:${att.bookId}`;
      const prevRounds = certRoundMap.get(mbKey) || 0;
      const roundNum = prevRounds + 1;
      certRoundMap.set(mbKey, roundNum);

      // 동일 도서 최대 2회차까지 포인트 지급
      if (roundNum <= 2) {
        const book = bookMap.get(att.bookId);
        const bookTitle = book?.title || '도서';
        const isHighGrade = isGrade4OrAbove(book?.grade || book?.level || book?.recommendGrade);
        const multiplier = isHighGrade ? 1.2 : 1;

        const ansObj = (att.answers && typeof att.answers === 'object' && !Array.isArray(att.answers))
          ? (att.answers as Record<string, any>)
          : {};
        const qrList = Array.isArray(ansObj.quizResults) ? ansObj.quizResults : [];
        const fallbackCorrect = qrList.length > 0
          ? qrList.filter((r: any) => r && r.isCorrect).length
          : Math.round((att.score / 100) * (att.questionCount || 5));
        const correctCount = (typeof att.correctCount === 'number' && att.correctCount > 0)
          ? att.correctCount
          : fallbackCorrect;

        const quizPoints = Math.round(correctCount * 3 * multiplier);
        if (quizPoints > 0) {
          const quizKind = `QUIZ_PASS_${roundNum}`;
          const quizAwardId = 'award_' + createHash('sha256')
            .update(JSON.stringify([att.memberId, att.bookId, quizKind, att.id]))
            .digest('hex');
          newPointHistories.push({
            id: quizAwardId,
            memberId: att.memberId,
            amount: quizPoints,
            pointType: quizKind,
            content: `${bookTitle} 북퀴즈 인증 완료 (${roundNum}회차 · 정답 ${correctCount}개 × 3P${isHighGrade ? ' · 초4이상 20% 가중' : ''})`,
            createdAt: att.completedAt,
          });
          earned += quizPoints;
        }

        if (att.thinkReply && String(att.thinkReply).trim().length > 0) {
          const thoughtKind = `THOUGHT_${roundNum}`;
          const thoughtPoints = Math.round(5 * multiplier);
          const thoughtAwardId = 'award_' + createHash('sha256')
            .update(JSON.stringify([att.memberId, att.bookId, thoughtKind, att.id]))
            .digest('hex');
          newPointHistories.push({
            id: thoughtAwardId,
            memberId: att.memberId,
            amount: thoughtPoints,
            pointType: thoughtKind,
            content: `${bookTitle} 생각담기 작성 (${roundNum}회차${isHighGrade ? ' · 초4이상 20% 가중' : ''})`,
            createdAt: att.completedAt,
          });
          earned += thoughtPoints;
        }

        if (earned > 0) {
          certifiedAwardedAttempts++;
          totalPointsAwarded += earned;
        }
      }
    }

    const currentEarned = (att.answers && typeof att.answers === 'object' && !Array.isArray(att.answers))
      ? (att.answers as any).earned
      : undefined;
    if (currentEarned !== earned) {
      attemptEarnedUpdates.push({ id: att.id, earned });
    }
  }

  console.log(`   - 전체 북퀴즈 응시 건수: ${attempts.length.toLocaleString()}건`);
  console.log(`   - 포인트 적립 대상 인증 건수(1~2회차): ${certifiedAwardedAttempts.toLocaleString()}건`);
  console.log(`   - 생성될 월별/일자별 포인트 내역(PointHistory): ${newPointHistories.length.toLocaleString()}건`);
  console.log(`   - 산출된 총 누적 적립 포인트 합계: ${totalPointsAwarded.toLocaleString()} P`);
  console.log(`   - answers.earned 갱신 대상 응시 건수: ${attemptEarnedUpdates.length.toLocaleString()}건`);

  if (dryRun) {
    console.log('   ✅ [DRY_RUN] 포인트 재산정 시뮬레이션 완료 (DB 미변경).\n');
    return {
      totalAttempts: attempts.length,
      certifiedAwardedAttempts,
      pointHistoryRows: newPointHistories.length,
      totalPointsAwarded,
    };
  }

  // 1. 기존 구형 레거시 포인트 및 기존 퀴즈 자동 적립분 정리 (수동 부여 포인트 MANUAL 등은 100% 보존!)
  console.log('   - [1/3] 구형/중복 퀴즈 포인트 정리 및 현행 기준 PointHistory 일괄 적재 중...');
  await prisma.pointHistory.deleteMany({
    where: {
      OR: [
        { legacyPhSeq: { not: null } },
        { id: { startsWith: 'award_' } },
        { pointType: { in: ['QUIZ', 'QUIZ_PASS_1', 'QUIZ_PASS_2', 'THOUGHT_1', 'THOUGHT_2'] } },
      ],
    },
  });

  for (const batch of chunk(newPointHistories, 2500)) {
    await prisma.pointHistory.createMany({ data: batch, skipDuplicates: true });
  }

  // 2. QuizAttempt.answers.earned 고속 배치 업데이트
  console.log('   - [2/3] 북퀴즈 응시 이력별 획득 포인트(answers.earned) 동기화 중...');
  for (const batch of chunk(attemptEarnedUpdates, 1500)) {
    const valuesSql = batch
      .map((item) => `('${item.id.replace(/'/g, "''")}', ${Number(item.earned) || 0})`)
      .join(',');
    await prisma.$executeRawUnsafe(`
      UPDATE "quiz_attempts" AS q
      SET "answers" = jsonb_set(
        CASE WHEN jsonb_typeof(q."answers") = 'object' THEN q."answers" ELSE '{}'::jsonb END,
        '{earned}',
        to_jsonb(v.earned::int),
        true
      )
      FROM (VALUES ${valuesSql}) AS v(id, earned)
      WHERE q."id" = v.id
    `);
  }

  // 3. 전 학생 누적 포인트(Member.points)를 PointHistory 합계(수동 부여분 포함)와 100% 일치하도록 갱신
  console.log('   - [3/3] 전 학생 보유 포인트(Member.points) 정밀 합산 반영 중...');
  await prisma.$executeRawUnsafe(`
    WITH pt_totals AS (
      SELECT "memberId", GREATEST(0, COALESCE(SUM("amount"), 0))::int AS total_pts
      FROM "point_histories"
      GROUP BY "memberId"
    )
    UPDATE "members" m
    SET "points" = COALESCE(p.total_pts, 0)
    FROM (
      SELECT s."id", pt.total_pts
      FROM "members" s
      LEFT JOIN pt_totals pt ON pt."memberId" = s."id"
      WHERE s."role" = '${Role.STUDENT}'
    ) p
    WHERE m."id" = p."id"
  `);

  console.log('   ✅ 전 기간 월별·누적 포인트 현행 기준 반영 완료!\n');
  return {
    totalAttempts: attempts.length,
    certifiedAwardedAttempts,
    pointHistoryRows: newPointHistories.length,
    totalPointsAwarded,
  };
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  recalculatePointsByCurrentPolicy()
    .catch((err) => {
      console.error('❌ 포인트 재산정 실패:', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

