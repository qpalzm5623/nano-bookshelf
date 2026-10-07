import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== [학원 매핑 정밀 분석] ===\n');

  // 전체 학원 목록
  const academies = await prisma.academy.findMany({
    include: {
      members: {
        select: { id: true, role: true, username: true, name: true },
      },
    },
    orderBy: { code: 'asc' },
  });

  const withDirector: any[] = [];
  const withoutDirector: any[] = [];

  for (const ac of academies) {
    const director = ac.members.find((m) => m.role === Role.DIRECTOR);
    const students = ac.members.filter((m) => m.role === Role.STUDENT);
    const teachers = ac.members.filter((m) => m.role === Role.TEACHER);

    if (director) {
      withDirector.push({
        code: ac.code,
        name: ac.name,
        director: `${director.name} (${director.username})`,
        studentCount: students.length,
        teacherCount: teachers.length,
      });
    } else {
      withoutDirector.push({
        id: ac.id,
        code: ac.code,
        name: ac.name,
        directorNameField: ac.directorName,
        studentCount: students.length,
        teacherCount: teachers.length,
      });
    }
  }

  console.log(`총 학원: ${academies.length}개소`);
  console.log(`- 원장 계정 존재 학원: ${withDirector.length}개소`);
  console.log(`- 원장 계정 부재 학원: ${withoutDirector.length}개소\n`);

  console.log('=== 원장 부재 학원 (학생 수 많은 순 상위 20개소) ===');
  withoutDirector.sort((a, b) => b.studentCount - a.studentCount);
  for (const w of withoutDirector.slice(0, 20)) {
    console.log(`[${w.code}] "${w.name}" - 학생 ${w.studentCount}명, 교사 ${w.teacherCount}명 (표기원장: ${w.directorNameField})`);
  }

  // 원장 학원 이름들과의 유사성 체크 (단순 공백 제거 비교)
  console.log('\n=== 원장 학원명과 공백제거/포함 유사성 매칭 검사 ===');
  const normalize = (s: string) => s.replace(/\s+/g, '').toLowerCase();
  const dirNameMap = new Map<string, any>();
  for (const d of withDirector) {
    dirNameMap.set(normalize(d.name), d);
  }

  let matchedByNorm = 0;
  for (const w of withoutDirector) {
    const norm = normalize(w.name);
    if (dirNameMap.has(norm)) {
      matchedByNorm++;
      const target = dirNameMap.get(norm);
      console.log(`[매칭 가능!] "${w.name}" (${w.code}, 학생 ${w.studentCount}명) ===> "${target.name}" (${target.code}, 원장: ${target.director})`);
    }
  }
  console.log(`공백제거로 원장 학원과 100% 일치하는 건수: ${matchedByNorm}건`);
}

main().finally(() => prisma.$disconnect());
