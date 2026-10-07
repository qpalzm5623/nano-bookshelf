// ==============================================================
// 레거시 덤프 프로파일링 (scripts/migrate/profile.ts)
// ==============================================================
// 목적: 변환 규칙(학년/요금제/상태/학원 연결 키 등)을 "추측"이 아니라
//       실제 데이터 분포를 보고 정하기 위한 읽기 전용 점검 스크립트.
// 실행: npx tsx scripts/migrate/profile.ts
// 결과: backups/migration_profile.txt (backups 는 .gitignore 대상)
// ==============================================================

import fs from 'fs';
import path from 'path';
import { loadTables, type LegacyRow } from './legacy-dump';
import { phpOrderedValues, tryPhpUnserialize } from './php-unserialize';

// 덤프 시점(2026-10-07) 기준 최근 3개월
const CUTOFF = '2026-07-07';

const lines: string[] = [];
const out = (text = '') => lines.push(text);

/** 값별 개수를 많은 순으로 "값=개수" 형태로 요약 */
function tally(rows: LegacyRow[], keyOf: (row: LegacyRow) => unknown, top = 15): string {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = String(keyOf(row));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([key, count]) => `${key === '' ? '(빈값)' : key}=${count}`)
    .join(' | ');
}

async function main() {
  const T = await loadTables(
    [
      'tb_user', 'tb_class', 'tb_book', 'tb_quiz', 'tb_code', 'tb_book_assignment',
      'tb_quiz_history', 'tb_point_history', 'tb_book_list', 'tb_notice', 'tb_banner',
    ],
    {
      // 큰 이력 테이블은 읽는 즉시 최근 3개월만 남긴다
      tb_quiz_history: (r) => String(r.reg_date ?? '') >= CUTOFF,
      tb_point_history: (r) => String(r.reg_date ?? '') >= CUTOFF,
      tb_book_assignment: (r) => String(r.reg_date ?? '') >= CUTOFF,
    },
  );

  // ---------------- 회원 ----------------
  const users = T.tb_user;
  const active = users.filter((u) => u.user_status === 'Y');
  const directors = active.filter((u) => u.user_type === 'director');
  const students = active.filter((u) => u.user_type === 'user');
  const teachers = active.filter((u) => u.user_type === 'teacher');
  const masters = active.filter((u) => u.user_type === 'master' || u.user_type === 'admin');

  out('=== [회원] ===');
  out(`전체 ${users.length} / 정상(Y) ${active.length}: 원장 ${directors.length}, 교사 ${teachers.length}, 학생 ${students.length}, 본사 ${masters.length}`);
  out(`user_id 중복(전체 행 기준): ${users.length - new Set(users.map((u) => u.user_id)).size}`);
  out(`user_id 중복(정상 회원 기준): ${active.length - new Set(active.map((u) => u.user_id)).size}`);
  out(`학생 학년(grade) 분포: ${tally(students, (u) => u.grade, 20)}`);
  out(`교사 학년(grade) 분포: ${tally(teachers, (u) => u.grade, 10)}`);
  out(`학생 성별: ${tally(students, (u) => u.gender)}`);
  out(`원장 요금제(pricing_plan): ${tally(directors, (u) => u.pricing_plan)}`);
  out(`원장 요금(pricing_price): ${tally(directors, (u) => u.pricing_price)}`);
  out(`원장 인원(use_count): ${tally(directors, (u) => u.use_count)}`);
  out(`원장 서비스종료일 연도: ${tally(directors, (u) => String(u.service_end_date ?? u.end_date ?? '').slice(0, 4))}`);

  // 학원 연결 키 검증: 학생의 group_user_seq 가 원장의 user_seq 와 같은지, group_name 으로는 몇 명이 매칭되는지
  const directorSeqs = new Set(directors.map((d) => String(d.user_seq)));
  const directorNames = new Set(directors.map((d) => String(d.group_name)));
  const byGroupSeq = students.filter((s) => directorSeqs.has(String(s.group_user_seq))).length;
  const byGroupName = students.filter((s) => directorNames.has(String(s.group_name))).length;
  out(`학생→원장 매칭: group_user_seq 일치 ${byGroupSeq}/${students.length}, group_name 일치 ${byGroupName}/${students.length}`);
  out(`학생 중 group_name 빈값: ${students.filter((s) => !s.group_name).length}`);
  out(`원장 group_name 중복: ${directors.length - directorNames.size}`);
  out(`학생 샘플(개인정보 제외): ` + students.slice(0, 3).map((s) => `{seq:${s.user_seq}, grp_seq:${s.group_user_seq}, grp:${s.group_name}, class_seq:${s.class_seq}, class:${s.class_name}, teacher:${s.group_teacher_id}, point:${s.point}}`).join(' '));
  out(`원장 샘플: ` + directors.slice(0, 4).map((d) => `{seq:${d.user_seq}, grp_seq:${d.group_user_seq}, grp:${d.group_name}, plan:${d.pricing_plan}, price:${d.pricing_price}, cnt:${d.use_count}, start:${d.start_date}, end:${d.end_date}, sstart:${d.service_start_date}, send:${d.service_end_date}}`).join(' '));
  out(`본사 계정 group_name: ${tally(masters, (u) => u.group_name)}`);
  out(`교사 group_user_seq 매칭: ${teachers.filter((t) => directorSeqs.has(String(t.group_user_seq))).length}/${teachers.length}`);

  // ---------------- 반 ----------------
  out('\n=== [반] ===');
  out(`tb_class ${T.tb_class.length}건, 학생 중 class_seq 보유 ${students.filter((s) => s.class_seq).length}`);
  out(`반 샘플: ` + T.tb_class.slice(0, 3).map((c) => `{seq:${c.class_seq}, name:${c.class_name}, grp:${c.group_user_seq}}`).join(' '));

  // ---------------- 도서 ----------------
  const books = T.tb_book;
  out('\n=== [도서] ===');
  out(`tb_book ${books.length}건`);
  out(`category: ${tally(books, (b) => b.category)} | sub_category: ${tally(books, (b) => b.sub_category)}`);
  out(`status: ${tally(books, (b) => b.status)} | open_yn: ${tally(books, (b) => b.open_yn)} | quiz_yn: ${tally(books, (b) => b.quiz_yn)} | recommend_yn: ${tally(books, (b) => b.recommend_yn)}`);
  out(`recommend_class(권장학년): ${tally(books, (b) => b.recommend_class, 20)}`);
  out(`book_no 3번째 글자(레벨 추정?): ${tally(books, (b) => String(b.book_no).charAt(2))}`);
  out(`book_no 길이: ${tally(books, (b) => String(b.book_no).length)}`);
  out(`표지 없음: ${books.filter((b) => !b.book_cover).length}, 워크시트 없음: ${books.filter((b) => !b.worksheet).length}`);
  out(`주제(subject): ${tally(books, (b) => b.subject, 20)}`);

  // ---------------- 퀴즈 ----------------
  const quizzes = T.tb_quiz;
  out('\n=== [퀴즈] ===');
  out(`tb_quiz ${quizzes.length}건 | confirm_yn: ${tally(quizzes, (q) => q.confirm_yn)} | status: ${tally(quizzes, (q) => q.status)}`);
  const quizPerBook = new Map<string, number>();
  for (const q of quizzes) quizPerBook.set(String(q.book_no), (quizPerBook.get(String(q.book_no)) ?? 0) + 1);
  out(`도서당 퀴즈 세트 수 분포: ${tally(quizzes, (q) => quizPerBook.get(String(q.book_no)))}`);
  out(`퀴즈 등록자(user_id) 상위: ${tally(quizzes, (q) => q.user_id, 5)}`);
  let parseFail = 0;
  const optionCounts = new Map<string, number>();
  const typeValues = new Map<string, number>();
  let answerIsOption = 0;
  let answerChecked = 0;
  for (const quiz of quizzes) {
    const parsed = tryPhpUnserialize(String(quiz.quiz_contents ?? ''));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) { parseFail++; continue; }
    const obj = parsed as Record<string, any>;
    const qList = phpOrderedValues(obj.q);
    const aList = phpOrderedValues(obj.a);
    qList.forEach((opts, idx) => {
      const optArr = phpOrderedValues(opts as any);
      optionCounts.set(String(optArr.length), (optionCounts.get(String(optArr.length)) ?? 0) + 1);
      answerChecked++;
      if (optArr.map(String).includes(String(aList[idx]))) answerIsOption++;
    });
    for (const t of phpOrderedValues(obj.type)) {
      for (const v of phpOrderedValues(t as any)) typeValues.set(String(v), (typeValues.get(String(v)) ?? 0) + 1);
    }
  }
  out(`퀴즈 파싱 실패 ${parseFail}건 | 문항당 보기 수: ${[...optionCounts.entries()].map(([k, v]) => `${k}개=${v}`).join(', ')}`);
  out(`type 값: ${[...typeValues.entries()].map(([k, v]) => `${k}=${v}`).join(', ')} | 정답이 보기 텍스트와 일치: ${answerIsOption}/${answerChecked}`);
  const sample = quizzes.find((q) => q.quiz_contents);
  out(`퀴즈 샘플 키: ${sample ? Object.keys((tryPhpUnserialize(String(sample.quiz_contents)) as object) ?? {}).join(',') : '-'}`);

  // ---------------- 학습 이력 (최근 3개월) ----------------
  const qh = T.tb_quiz_history;
  const userIds = new Set(active.map((u) => String(u.user_id)));
  const bookNos = new Set(books.map((b) => String(b.book_no)));
  out(`\n=== [학습이력: ${CUTOFF} 이후] ===`);
  out(`tb_quiz_history ${qh.length}건 | 정상회원 소유 ${qh.filter((r) => userIds.has(String(r.user_id))).length} | 도서 존재 ${qh.filter((r) => bookNos.has(String(r.book_no))).length}`);
  out(`quiz_cnt: ${tally(qh, (r) => r.quiz_cnt)} | read_yn: ${tally(qh, (r) => r.read_yn)} | recommend_yn: ${tally(qh, (r) => r.recommend_yn)}`);
  out(`생각담기 답변 보유: ${qh.filter((r) => r.think_reply).length} | 이미지 보유: ${qh.filter((r) => r.think_reply_file).length}`);
  out(`월별: ${tally(qh, (r) => String(r.reg_date).slice(0, 7))}`);
  const qhSample = qh.find((r) => r.quiz_answer_result);
  if (qhSample) {
    const parsed = tryPhpUnserialize(String(qhSample.quiz_answer_result));
    out(`quiz_answer_result 샘플: ${JSON.stringify(parsed).slice(0, 300)}`);
    out(`quiz_result 샘플: ${JSON.stringify(tryPhpUnserialize(String(qhSample.quiz_result))).slice(0, 200)} | score=${qhSample.score}, correct=${qhSample.correct_cnt}/${qhSample.quiz_cnt}`);
  }
  out(`점수 분포(상위): ${tally(qh, (r) => r.score, 8)}`);

  const ph = T.tb_point_history;
  out(`tb_point_history ${ph.length}건 | point_type: ${tally(ph, (r) => r.point_type)} | content: ${tally(ph, (r) => r.content, 6)}`);
  const ba = T.tb_book_assignment;
  out(`tb_book_assignment ${ba.length}건 | confirm_yn: ${tally(ba, (r) => r.confirm_yn)} | status: ${tally(ba, (r) => r.status)} | group_user_seq 매칭: ${ba.filter((r) => directorSeqs.has(String(r.group_user_seq))).length}`);

  // ---------------- 코드 / 학원 보유도서 / 공지 / 배너 ----------------
  out('\n=== [기타] ===');
  out(`tb_code 그룹: ${tally(T.tb_code, (c) => c.code_group)}`);
  out(`topic 코드: ` + T.tb_code.filter((c) => c.code_group === 'topic').map((c) => `${c.code_type}(${c.code_status})`).join(', '));
  out(`tb_book_list ${T.tb_book_list.length}건 | 정상 원장 학원 매칭 ${T.tb_book_list.filter((r) => directorNames.has(String(r.group_name))).length} | 빈 group_name ${T.tb_book_list.filter((r) => !r.group_name).length}`);
  out(`tb_notice ${T.tb_notice.length}건 read_type: ${tally(T.tb_notice, (n) => n.notice_read_type)} | tb_banner ${T.tb_banner.length}건 status: ${tally(T.tb_banner, (b) => b.status)}`);

  const outDir = path.join(process.cwd(), 'backups');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'migration_profile.txt'), lines.join('\n'), 'utf-8');
  console.log('프로파일링 완료 → backups/migration_profile.txt');
}

main().catch((error) => {
  console.error('프로파일링 실패:', error);
  process.exit(1);
});
