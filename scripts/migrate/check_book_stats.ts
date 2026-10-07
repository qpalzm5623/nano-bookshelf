import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.book.count();
  const withTags = await prisma.book.count({ where: { tags: { not: null } } });
  const withSubject = await prisma.book.count({ where: { subject: { not: null } } });
  const withSeries = await prisma.book.count({ where: { series: { not: null } } });
  const categories = await prisma.book.groupBy({ by: ['category'], _count: { id: true } });
  const subCategories = await prisma.book.groupBy({ by: ['subCategory'], _count: { id: true } });
  const subjects = await prisma.book.groupBy({ by: ['subject'], _count: { id: true } });
  const grades = await prisma.book.groupBy({ by: ['grade'], _count: { id: true } });

  console.log(`전체 도서: ${total}`);
  console.log(`태그 보유: ${withTags}`);
  console.log(`주제 보유: ${withSubject}`);
  console.log(`시리즈 보유: ${withSeries}`);
  console.log('카테고리(category):', JSON.stringify(categories));
  console.log('서브카테고리(subCategory):', JSON.stringify(subCategories));
  console.log('주제(subject):', JSON.stringify(subjects));
  console.log('학년(grade):', JSON.stringify(grades));
}

main().finally(() => prisma.$disconnect());
