import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.member.groupBy({
    by: ['role'],
    _count: { id: true },
  });
  console.log('--- MEMBER ROLES ---');
  console.log(JSON.stringify(roles, null, 2));

  const totalMembers = await prisma.member.count();
  console.log(`Total members: ${totalMembers}`);

  // 원장님 샘플
  const directors = await prisma.member.findMany({
    where: { role: 'DIRECTOR' },
    take: 5,
    include: { academy: { select: { code: true, name: true } } },
  });
  console.log('--- DIRECTORS (Sample) ---');
  directors.forEach(d => console.log(`[${d.username}] ${d.name} | 학원: ${d.academy?.name} (${d.academy?.code}) | tel: ${d.phone}`));

  // 선생님 샘플
  const teachers = await prisma.member.findMany({
    where: { role: 'TEACHER' },
    take: 5,
    include: { academy: { select: { code: true, name: true } } },
  });
  console.log('--- TEACHERS (Sample) ---');
  teachers.forEach(t => console.log(`[${t.username}] ${t.name} | 학원: ${t.academy?.name} (${t.academy?.code}) | tel: ${t.phone}`));

  // 학생 샘플
  const students = await prisma.member.findMany({
    where: { role: 'STUDENT' },
    take: 5,
    include: { academy: { select: { code: true, name: true } } },
  });
  console.log('--- STUDENTS (Sample) ---');
  students.forEach(s => console.log(`[${s.username}] ${s.name} | 학원: ${s.academy?.name} (${s.academy?.code}) | 학년: ${s.grade} | P: ${s.points}`));
}

main().finally(() => prisma.$disconnect());
