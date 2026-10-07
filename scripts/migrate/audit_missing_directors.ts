import { loadTables } from './legacy-dump';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const T = await loadTables(['tb_user']);
  const allAcademies = await prisma.academy.findMany({
    include: {
      members: { select: { role: true, username: true } },
    },
  });

  const withoutDirector = allAcademies.filter(
    (a) => !a.members.some((m) => m.role === 'DIRECTOR') && a.code !== 'ACAD-HQ'
  );

  console.log(`원장 부재 학원: ${withoutDirector.length}개소 전수 조사\n`);

  let countWithNStatusDirector = 0;
  let countWithTeacherOnly = 0;
  let countWithNoStaff = 0;

  for (const ac of withoutDirector) {
    const rawUsers = T.tb_user.filter((u) => u.group_name === ac.name);
    const nDirectors = rawUsers.filter((u) => u.user_type === 'director');
    const teachers = rawUsers.filter((u) => u.user_type === 'teacher' && u.user_status === 'Y');

    if (nDirectors.length > 0) {
      countWithNStatusDirector++;
      console.log(`[원장 N 상태 존재] "${ac.name}" (${ac.code}):`);
      for (const d of nDirectors) {
        console.log(`   - 원장: ${d.user_name} (${d.user_id}, status=${d.user_status}, plan=${d.pricing_plan})`);
      }
    } else if (teachers.length > 0) {
      countWithTeacherOnly++;
      console.log(`[교사만 Y 상태] "${ac.name}" (${ac.code}): 교사 ${teachers.length}명 (${teachers[0].user_name} 등)`);
    } else {
      countWithNoStaff++;
      console.log(`[교직원 전무/학생만 있음] "${ac.name}" (${ac.code})`);
    }
  }

  console.log(`\n=== 요약 ===`);
  console.log(`- 레거시에 원장 계정(status=N 포함)이 존재하는 학원: ${countWithNStatusDirector}개소`);
  console.log(`- 원장은 없지만 교사(Y)가 존재하는 학원: ${countWithTeacherOnly}개소`);
  console.log(`- 교직원이 전혀 없는 학원: ${countWithNoStaff}개소`);
}

main().finally(() => prisma.$disconnect());
