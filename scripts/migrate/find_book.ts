import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const book = await prisma.book.findFirst({
    where: { title: { contains: '10층 큰 나무 아파트' } },
  });
  console.log('--- FOUND BOOK IN NEON ---');
  console.log(JSON.stringify(book, null, 2));

  // 다른 몇 권의 책도 샘플로 조회해보기
  const sampleBooks = await prisma.book.findMany({
    take: 5,
    where: { tags: { not: null } }
  });
  console.log('--- SAMPLE BOOKS WITH TAGS ---');
  for (const b of sampleBooks) {
    console.log(`[${b.bookNo}] ${b.title} | category: ${b.category} | subCategory: ${b.subCategory} | subject: ${b.subject} | tags: ${b.tags}`);
  }
}

main().finally(() => prisma.$disconnect());
