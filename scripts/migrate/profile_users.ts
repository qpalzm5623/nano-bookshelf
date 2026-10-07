import { loadTables } from './legacy-dump';

async function main() {
  const T = await loadTables(['tb_user'], {
    tb_user: (r) => r.user_status === 'Y'
  });

  console.log(`총 정상 회원 수: ${T.tb_user.length}`);

  // 학원별 집계
  const groupCounts = new Map<string, { total: number; directors: number; teachers: number; students: number }>();
  for (const u of T.tb_user) {
    const grp = String(u.group_name ?? '미지정').trim();
    const cur = groupCounts.get(grp) || { total: 0, directors: 0, teachers: 0, students: 0 };
    cur.total++;
    if (u.user_type === 'director') cur.directors++;
    else if (u.user_type === 'teacher') cur.teachers++;
    else if (u.user_type === 'student') cur.students++;
    groupCounts.set(grp, cur);
  }

  console.log(`총 소속 학원 수: ${groupCounts.size}`);
  
  // 가명/테스트 패턴('소속명', '이름', 'test', '학생1') 비율 조사
  let testCount = 0;
  let realCount = 0;
  for (const u of T.tb_user) {
    const name = String(u.user_name ?? '');
    const grp = String(u.group_name ?? '');
    if (grp.startsWith('소속명') || name.startsWith('이름') || name.startsWith('학생') || name.startsWith('선생님') || name.startsWith('교사')) {
      testCount++;
    } else {
      realCount++;
    }
  }

  console.log(`테스트/가명 계정 수: ${testCount}명`);
  console.log(`실제 계정 수: ${realCount}명`);

  // 실제 계정 샘플 상위 20개
  console.log('\n--- 실제 계정 샘플 (최대 20개) ---');
  let shown = 0;
  for (const u of T.tb_user) {
    const name = String(u.user_name ?? '');
    const grp = String(u.group_name ?? '');
    if (!grp.startsWith('소속명') && !name.startsWith('이름') && !name.startsWith('학생') && !name.startsWith('선생님') && !name.startsWith('교사')) {
      console.log(`[${u.user_type}] ${u.user_id} (${name}) | 소속: ${grp} | phone: ${u.cell_no}`);
      shown++;
      if (shown >= 20) break;
    }
  }

  // 상위 학원 10개 목록
  console.log('\n--- 인원수 많은 상위 학원 10개 ---');
  const sortedGroups = [...groupCounts.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 10);
  for (const [grp, counts] of sortedGroups) {
    console.log(`[${grp}] 총 ${counts.total}명 (원장 ${counts.directors}, 교사 ${counts.teachers}, 학생 ${counts.students})`);
  }
}

main();
