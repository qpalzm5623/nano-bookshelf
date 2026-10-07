import { loadTables } from './legacy-dump';

async function main() {
  const T = await loadTables(['tb_user']);
  const targetGroups = ['깊독국어논술문해력학원', '리딩리더 플러스 학원', '러닝트리수학'];

  console.log('=== 레거시 tb_user에서 원장 부재 학원명 검색 ===');
  for (const grp of targetGroups) {
    const users = T.tb_user.filter((u) => u.group_name === grp);
    console.log(`\n학원명: [${grp}] - 총 ${users.length}명`);
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const u of users) {
      byType[String(u.user_type)] = (byType[String(u.user_type)] ?? 0) + 1;
      byStatus[String(u.user_status)] = (byStatus[String(u.user_status)] ?? 0) + 1;
    }
    console.log('유저 유형 분포:', byType);
    console.log('유저 상태 분포:', byStatus);
    const nonStudents = users.filter((u) => u.user_type !== 'user');
    for (const ns of nonStudents) {
      console.log(`- 비학생 계정: seq=${ns.user_seq}, id=${ns.user_id}, name=${ns.user_name}, type=${ns.user_type}, status=${ns.user_status}`);
    }
  }
}

main().catch(console.error);
