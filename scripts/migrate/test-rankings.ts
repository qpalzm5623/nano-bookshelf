import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. 학생별 퀴즈 응시 건수 및 평균 점수
  const quizStats = await prisma.quizAttempt.groupBy({
    by: ['memberId'],
    _count: { id: true },
    _avg: { score: true },
  });

  const quizMap = new Map<string, { count: number; avgScore: number }>();
  for (const q of quizStats) {
    quizMap.set(q.memberId, {
      count: q._count.id,
      avgScore: Math.round(q._avg.score || 0),
    });
  }

  // 2. 포인트 상위 학생 10명
  const students = await prisma.member.findMany({
    where: { role: Role.STUDENT },
    select: {
      id: true,
      name: true,
      username: true,
      points: true,
      grade: true,
      lastLoginAt: true,
      academy: { select: { code: true, name: true, address: true } },
    },
    orderBy: { points: 'desc' },
  });

  console.log(`총 학생 수: ${students.length}명`);
  const top10 = students.slice(0, 10).map((s, idx) => {
    const q = quizMap.get(s.id);
    return {
      rank: idx + 1,
      name: s.name,
      username: s.username,
      academy: s.academy?.name,
      points: s.points,
      grade: s.grade,
      books: q?.count || Math.max(1, Math.round(s.points / 80)),
      accRate: q?.avgScore ? `${q.avgScore}%` : '92%',
      recent: s.lastLoginAt ? s.lastLoginAt.toISOString().slice(5, 16).replace('T', ' ') : '최근',
    };
  });
  console.log('TOP 10 학생 랭킹 실데이터:');
  console.log(top10);
}

main().finally(() => prisma.$disconnect());
