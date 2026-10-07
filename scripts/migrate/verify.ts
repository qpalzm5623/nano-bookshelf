import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== [1] 테이블별 데이터 건수 ===');
  const [academies, members, classes, books, quizzes, attempts, points, academyBooks] = await Promise.all([
    prisma.academy.count(),
    prisma.member.count(),
    prisma.classGroup.count(),
    prisma.book.count(),
    prisma.bookQuiz.count(),
    prisma.quizAttempt.count(),
    prisma.pointHistory.count(),
    prisma.academyBook.count(),
  ]);

  console.log({
    가맹학원: academies,
    회원전체: members,
    클래스: classes,
    도서전체: books,
    북퀴즈문항: quizzes,
    최근3개월_퀴즈응시: attempts,
    최근3개월_포인트: points,
    학원보유도서: academyBooks,
  });

  console.log('\n=== [2] 회원 유형별 분포 ===');
  const roleCounts = await prisma.member.groupBy({
    by: ['role'],
    _count: { _all: true },
  });
  console.log(roleCounts.map((r) => `${r.role}: ${r._count._all}명`).join(' | '));

  console.log('\n=== [3] 실제 학습 이력(QuizAttempt) 연동 샘플 (최근 3건) ===');
  const sampleAttempts = await prisma.quizAttempt.findMany({
    take: 3,
    orderBy: { completedAt: 'desc' },
    include: {
      member: {
        select: {
          name: true,
          username: true,
          role: true,
          academy: { select: { name: true, code: true } },
          classGroup: { select: { name: true } },
        },
      },
    },
  });

  // book 정보를 조회하여 병합
  for (const a of sampleAttempts) {
    const book = await prisma.book.findUnique({
      where: { id: a.bookId },
      select: { title: true, author: true, category: true, bookNo: true },
    });
    console.log({
      id: a.id,
      학생: `${a.member.name} (${a.member.username})`,
      학원: a.member.academy?.name ?? '미지정',
      반: a.member.classGroup?.name ?? '미지정',
      도서: book ? `${book.title} (저자: ${book.author}, No: ${book.bookNo})` : '도서정보 없음',
      점수: `${a.score}점 (${a.correctCount}/${a.questionCount})`,
      풀이일시: a.completedAt.toISOString().slice(0, 19).replace('T', ' '),
    });
  }

  console.log('\n=== [4] 최근 포인트 적립 샘플 (최근 3건) ===');
  const samplePoints = await prisma.pointHistory.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      member: {
        select: {
          name: true,
          username: true,
          academy: { select: { name: true } },
        },
      },
    },
  });

  for (const p of samplePoints) {
    console.log({
      회원: `${p.member.name} (${p.member.username})`,
      학원: p.member.academy?.name,
      변동: `${p.amount > 0 ? '+' : ''}${p.amount} P`,
      유형: p.pointType,
      내용: p.content,
      일시: p.createdAt.toISOString().slice(0, 19).replace('T', ' '),
    });
  }

  console.log('\n=== [5] 학원별 학생 수 TOP 5 ===');
  const topAcademies = await prisma.academy.findMany({
    where: { code: { not: 'HQ' } },
    select: {
      name: true,
      code: true,
      _count: {
        select: {
          members: { where: { role: 'STUDENT' } },
          academyBooks: true,
        },
      },
    },
    orderBy: {
      members: { _count: 'desc' },
    },
    take: 5,
  });

  for (const ac of topAcademies) {
    console.log(`- ${ac.name} (${ac.code}): 학생 ${ac._count.members}명 | 보유도서 ${ac._count.academyBooks}권`);
  }

  console.log('\n=== [6] 테스트 로그인 샘플 계정 안내 (비밀번호: nano123!) ===');
  const [directorSample, teacherSample, studentSample] = await Promise.all([
    prisma.member.findFirst({ where: { role: 'DIRECTOR' }, select: { username: true, name: true, academy: { select: { name: true } } } }),
    prisma.member.findFirst({ where: { role: 'TEACHER' }, select: { username: true, name: true, academy: { select: { name: true } } } }),
    prisma.member.findFirst({ where: { role: 'STUDENT' }, select: { username: true, name: true, academy: { select: { name: true } } } }),
  ]);

  console.log('원장 샘플:', directorSample);
  console.log('교사 샘플:', teacherSample);
  console.log('학생 샘플:', studentSample);
}

main().finally(() => prisma.$disconnect());
