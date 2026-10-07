import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 [나노의책장] 학생 완독 권수(bookCount) 및 평균 점수(quizAvg) 실데이터 동기화 시작...\n');

  // 1. QuizAttempt 테이블에서 학생별 응시 횟수(완독 수) 및 평균 점수 계산
  const stats = await prisma.quizAttempt.groupBy({
    by: ['memberId'],
    _count: { id: true },
    _avg: { score: true },
  });

  console.log(`총 퀴즈 풀이 이력이 있는 학생: ${stats.length}명`);

  let updatedCount = 0;
  for (const s of stats) {
    const bookCount = s._count.id;
    const quizAvg = Math.round((s._avg.score || 0) * 10) / 10;

    await prisma.member.update({
      where: { id: s.memberId },
      data: {
        bookCount,
        quizAvg,
      },
    });
    updatedCount++;
  }

  console.log(`✅ ${updatedCount}명의 학생 통계 동기화 완료!`);

  // 샘플 검증
  const samples = await prisma.member.findMany({
    where: { role: Role.STUDENT, bookCount: { gt: 0 } },
    take: 5,
    orderBy: { bookCount: 'desc' },
    select: { name: true, username: true, points: true, bookCount: true, quizAvg: true, academy: { select: { name: true } } },
  });

  console.log('\n=== 상위 완독 학생 통계 샘플 ===');
  for (const sp of samples) {
    console.log(`- ${sp.name} (${sp.username}, ${sp.academy?.name}): 완독 ${sp.bookCount}권 | 평균 ${sp.quizAvg}점 | 포인트 ${sp.points}P`);
  }
}

main()
  .catch((e) => {
    console.error('❌ 통계 동기화 오류:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
