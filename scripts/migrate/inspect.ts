// 임시 점검 스크립트: 퀴즈 직렬화 구조와 코드표를 눈으로 확인하기 위한 용도 (확인 후 삭제)
import fs from 'fs';
import path from 'path';
import { loadTables } from './legacy-dump';
import { tryPhpUnserialize } from './php-unserialize';

async function main() {
  const T = await loadTables(['tb_quiz', 'tb_code', 'tb_user', 'tb_quiz_history'], {
    tb_quiz_history: (r) => Number(r.qh_seq) <= 3000,
  });
  const out: string[] = [];

  // 서로 다른 유형(문항 수/세트 수)의 퀴즈 3개를 원문 그대로 본다
  const samples = [T.tb_quiz[0], T.tb_quiz[2000], T.tb_quiz[5000]];
  for (const quiz of samples) {
    out.push(`--- quiz_seq=${quiz.quiz_seq} book=${quiz.book_no} quiz_cnt=${quiz.quiz_cnt} ---`);
    out.push(`RAW: ${String(quiz.quiz_contents).slice(0, 1500)}`);
    out.push(`PARSED: ${JSON.stringify(tryPhpUnserialize(String(quiz.quiz_contents))).slice(0, 1500)}`);
  }

  out.push('\n--- 코드표 rate_plan / question / book_type ---');
  for (const c of T.tb_code.filter((c) => ['rate_plan', 'book_type', 'book_region'].includes(String(c.code_group)))) {
    out.push(`${c.code_group} | type=${c.code_type} | name=${c.code_name} | desc=${c.code_desc} | status=${c.code_status}`);
  }

  const active = T.tb_user.filter((u) => u.user_status === 'Y');
  const teachers = active.filter((u) => u.user_type === 'teacher');
  const directors = active.filter((u) => u.user_type === 'director');
  const dirNames = new Set(directors.map((d) => String(d.group_name)));
  out.push('\n--- 교사 소속 필드 ---');
  out.push(`교사 group_name 매칭: ${teachers.filter((t) => dirNames.has(String(t.group_name))).length}/${teachers.length}`);
  out.push(`교사 group_name 빈값: ${teachers.filter((t) => !t.group_name).length}`);
  out.push(`교사 샘플: ` + teachers.slice(0, 3).map((t) => `{grp:${t.group_name}, class:${t.class_name}, gtid:${t.group_teacher_id}, guid:${t.group_user_id}, type:${t.user_type}}`).join(' '));
  const students = active.filter((u) => u.user_type === 'user');
  out.push(`학생 group_teacher_id 보유: ${students.filter((s) => s.group_teacher_id).length} | group_user_id 보유: ${students.filter((s) => s.group_user_id).length}`);
  const classNames = new Map<string, number>();
  for (const s of students) classNames.set(String(s.class_name), (classNames.get(String(s.class_name)) ?? 0) + 1);
  out.push(`반 이름 종류 ${classNames.size}개: ` + [...classNames.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k}=${v}`).join(' | '));
  out.push(`학생 user_id 형태 샘플: ` + students.slice(0, 5).map((s) => `${s.user_id}`).join(', '));
  out.push(`학생 이름 샘플(익명화 여부 확인): ` + students.slice(0, 5).map((s) => `${s.user_name}`).join(', '));
  out.push(`학부모 연락처 샘플(익명화 여부 확인): ` + students.slice(0, 3).map((s) => `${s.parent_cell}/${s.cell_no}`).join(', '));
  out.push(`원장 이름/이메일 샘플: ` + directors.slice(0, 3).map((d) => `${d.user_name}/${d.email}`).join(', '));
  out.push(`쪽지·메모 보유 학생: memo=${students.filter((s) => s.memo).length}`);
  out.push(`user_status=Y 이면서 withdrawal_date 있는 회원: ${active.filter((u) => u.withdrawal_date).length}`);
  out.push(`학생 end_date 지난 회원(2026-10-07 기준): ${students.filter((s) => s.end_date && String(s.end_date) < '2026-10-07').length}`);
  out.push(`학생 마지막 로그인 최근 3개월: ${students.filter((s) => String(s.last_login_time ?? '') >= '2026-07-07').length}`);

  fs.writeFileSync(path.join(process.cwd(), 'backups', 'migration_inspect.txt'), out.join('\n'), 'utf-8');
  console.log('완료 → backups/migration_inspect.txt');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
