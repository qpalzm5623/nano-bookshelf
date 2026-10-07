// ==============================================================
// 나노의책장 - 고속 배치(createMany) 데이터 이관 실행기
// ==============================================================
// 사용자 지침:
//  1. 신규 스택(Neon Postgres / Prisma)으로 변환
//  2. 정상 회원(user_status = 'Y')만 이관
//  3. 상태 N은 이용 종료(제외)
//  4. 학습이력은 최근 3개월 (2026-07-07 이후)만 이관
//  5. 비밀번호는 'nano123!'으로 통일
//  6. 필요한 신규 스키마 모두 생성 및 매핑
// ==============================================================

import { prisma } from '../../lib/prisma';
import { loadTables } from './legacy-dump';
import { tryPhpUnserialize } from './php-unserialize';
import { PlanTier, Role, MemberStatus, QuizType, AcademyStatus } from '@prisma/client';

const CUTOFF_DATE = '2026-07-07';
const DEFAULT_PASSWORD = 'nano123!';

function mapPlanTier(plan: any): PlanTier {
  const p = String(plan ?? '').trim();
  if (p === '10' || p.toLowerCase() === 'basic') return PlanTier.BASIC;
  if (p === '30' || p.toLowerCase() === 'standard') return PlanTier.STANDARD;
  if (p === '50' || p.toLowerCase() === 'premium') return PlanTier.PREMIUM;
  if (p === '100' || p.toLowerCase() === 'royal') return PlanTier.ROYAL;
  if (p === '150' || p === '200' || p.toLowerCase() === 'vip') return PlanTier.VIP;
  return PlanTier.STANDARD;
}

function mapGrade(grade: any): string {
  if (grade === null || grade === undefined || grade === '') return '미지정';
  const g = Number(grade);
  if (isNaN(g)) return String(grade);
  if (g === 0) return '유치부';
  if (g >= 1 && g <= 6) return `초${g}`;
  if (g >= 7 && g <= 9) return `중${g - 6}`;
  if (g >= 10) return `고${g - 9}`;
  return `${g}학년`;
}

function parseSafeDate(val: any, fallback: Date | null): Date | null {
  if (!val) return fallback;
  const s = String(val).trim();
  if (!s || s.startsWith('0000') || s.startsWith('00-00')) return fallback;
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
}

function chunk<T>(array: T[], size: number): T[][] {
  const res: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    res.push(array.slice(i, i + size));
  }
  return res;
}

async function runMigration() {
  console.log('🚀 [나노의책장] 초고속 배치 이관 시작...\n');

  // 1. 덤프 데이터 로딩
  console.log('📥 1/7. 덤프 파일 스트리밍 파싱 중...');
  const T = await loadTables(
    [
      'tb_code',
      'tb_book',
      'tb_quiz',
      'tb_user',
      'tb_class',
      'tb_quiz_history',
      'tb_point_history',
      'tb_book_list',
      'tb_banner',
      'tb_notice',
    ],
    {
      tb_user: (r) => r.user_status === 'Y',
      tb_quiz_history: (r) => String(r.reg_date ?? '') >= CUTOFF_DATE,
      tb_point_history: (r) => String(r.reg_date ?? '') >= CUTOFF_DATE,
    }
  );

  console.log(`   - 정상 회원: ${T.tb_user.length}명`);
  console.log(`   - 도서: ${T.tb_book.length}권`);
  console.log(`   - 퀴즈 세트: ${T.tb_quiz.length}건`);
  console.log(`   - 최근 3개월 퀴즈 풀이 이력: ${T.tb_quiz_history.length}건`);
  console.log(`   - 최근 3개월 포인트 이력: ${T.tb_point_history.length}건\n`);

  // 2. 테마 카테고리 (ThemeCategory)
  console.log('📚 2/7. 테마 카테고리(ThemeCategory) 적재 중...');
  const topicCodes = T.tb_code.filter((c) => c.code_group === 'topic');
  const themeMap = new Map<string, string>();

  for (const tc of topicCodes) {
    const code = `THM-${String(tc.code_type ?? tc.code_seq)}`;
    const name = String(tc.code_name ?? tc.code_type);
    const desc = tc.code_desc ? String(tc.code_desc) : null;

    const theme = await prisma.themeCategory.upsert({
      where: { code },
      update: { name, description: desc },
      create: { code, name, description: desc },
    });
    themeMap.set(name, theme.id);
  }
  console.log(`   ✅ 테마 카테고리 ${themeMap.size}개 준비 완료.\n`);

  // 3. 도서 (Book) & 북퀴즈 (BookQuiz)
  console.log('📖 3/7. 도서(Book) 및 북퀴즈(BookQuiz) 적재 확인 중...');
  const booksData = T.tb_book.map((b) => {
    const bNo = String(b.book_no);
    const title = String(b.book_name ?? '제목 없음');
    const author = String(b.author ?? '저자 미상');
    const pub = b.publisher ? String(b.publisher) : null;
    const isbn = b.isbn ? String(b.isbn) : null;
    const series = b.serise ? String(b.serise) : null;
    const cover = b.book_cover ? `/upload/book/${b.book_cover}` : null;
    const ws = b.worksheet ? `/upload/book/${b.worksheet}` : null;
    const cat = b.category ? String(b.category) : null;
    const subCat = b.sub_category ? String(b.sub_category) : null;
    const gr = b.recommend_class ? mapGrade(b.recommend_class) : null;
    const tags = b.tags ? String(b.tags) : null;
    const award = b.award ? String(b.award) : null;
    const subj = b.subject ? String(b.subject) : null;
    const thinkTitle = b.think_title ? String(b.think_title) : null;
    const thinkQuiz = b.think_quiz ? String(b.think_quiz) : null;
    const isRec = b.recommend_yn === 'Y';
    const themeId = subj && themeMap.has(subj) ? themeMap.get(subj) : null;

    return {
      bookNo: bNo,
      title,
      author,
      publisher: pub,
      isbn,
      series,
      coverUrl: cover,
      worksheetUrl: ws,
      category: cat,
      subCategory: subCat,
      grade: gr,
      tags,
      award,
      subject: subj,
      thinkTitle,
      thinkQuiz,
      isRecommended: isRec,
      themeId,
    };
  });

  for (const bBatch of chunk(booksData, 500)) {
    await prisma.book.createMany({ data: bBatch, skipDuplicates: true });
  }

  const allBooks = await prisma.book.findMany({ select: { id: true, bookNo: true } });
  const bookIdMap = new Map<string, string>();
  for (const b of allBooks) bookIdMap.set(b.bookNo, b.id);
  console.log(`   ✅ 도서 ${bookIdMap.size}권 준비 완료.`);

  // 북퀴즈 문항
  const existingQuizCount = await prisma.bookQuiz.count();
  let totalQuizzesInserted = existingQuizCount;
  if (existingQuizCount === 0) {
    console.log('   - 북퀴즈 문항 대량 적재 중...');
    const quizzesData: Array<{
      bookId: string;
      questionNo: number;
      question: string;
      quizType: QuizType;
      options: any;
      correctAnswer: string;
      score: number;
      legacyQuizSeq: number;
    }> = [];

    for (const q of T.tb_quiz) {
      const bNo = String(q.book_no);
      const bookId = bookIdMap.get(bNo);
      if (!bookId) continue;

      const parsed = tryPhpUnserialize(String(q.quiz_contents ?? ''));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) continue;

      const obj = parsed as Record<string, any>;
      const questions = obj.q ? (obj.q as Record<string, string>) : {};
      const answers = obj.a ? (obj.a as Record<string, any>) : {};
      const c1 = obj.c1 ? (obj.c1 as Record<string, any>) : {};
      const c2 = obj.c2 ? (obj.c2 as Record<string, any>) : {};
      const c3 = obj.c3 ? (obj.c3 as Record<string, any>) : {};
      const c4 = obj.c4 ? (obj.c4 as Record<string, any>) : {};
      const c5 = obj.c5 ? (obj.c5 as Record<string, any>) : {};

      const qKeys = Object.keys(questions).sort((a, b) => Number(a) - Number(b));
      for (const k of qKeys) {
        const qText = questions[k];
        if (!qText) continue;
        const qNum = parseInt(k, 10) || 1;
        const rawAns = answers[k];
        const optList: string[] = [c1[k], c2[k], c3[k], c4[k], c5[k]].filter(
          (v) => v !== null && v !== undefined && String(v).trim() !== ''
        );

        quizzesData.push({
          bookId,
          questionNo: qNum,
          question: String(qText),
          quizType: QuizType.MULTIPLE_CHOICE,
          options: optList.length > 0 ? optList : null,
          correctAnswer: String(rawAns ?? '1'),
          score: 20,
          legacyQuizSeq: Number(q.quiz_seq),
        });
      }
    }

    for (const qBatch of chunk(quizzesData, 500)) {
      await prisma.bookQuiz.createMany({ data: qBatch, skipDuplicates: true });
    }
    totalQuizzesInserted = quizzesData.length;
  }
  console.log(`   ✅ 북퀴즈 문항 ${totalQuizzesInserted}건 준비 완료.\n`);

  // 4. 가맹 학원 (Academy) 및 클래스(ClassGroup)
  console.log('🏫 4/7. 가맹 학원(Academy) 및 클래스(ClassGroup) 정리 및 적재 중...');

  // 기존 임시/더미 데이터 정리
  await prisma.quizAttempt.deleteMany();
  await prisma.pointHistory.deleteMany();
  await prisma.academyBook.deleteMany();
  await prisma.bookAssignment.deleteMany();
  await prisma.member.deleteMany();
  await prisma.classGroup.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.aligoDispatchLog.deleteMany();
  await prisma.academy.deleteMany();

  const academyMap = new Map<string, string>(); // groupName -> academyId

  // 본사 기본 학원
  const hqAcademy = await prisma.academy.create({
    data: {
      code: 'ACAD-HQ',
      name: '나노의책장 본사',
      directorName: '본사 관리자',
      phone: '02-1588-0000',
      email: 'master@nano.kr',
      plan: PlanTier.ROYAL,
      maxStudents: 9999,
      monthlyFee: 0,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2099-12-31'),
      status: AcademyStatus.ACTIVE,
    },
  });
  academyMap.set('관리자', hqAcademy.id);
  academyMap.set('나노의책장 본사', hqAcademy.id);
  academyMap.set('나노의책장본사02', hqAcademy.id);

  // 원장 기반 학원
  const directors = T.tb_user.filter((u) => u.user_type === 'director');
  let acadIdx = 1;

  for (const d of directors) {
    const dSeq = Number(d.user_seq);
    const grpName = String(d.group_name ?? d.user_name ?? `가맹학원${dSeq}`).trim();
    const code = `ACAD-${String(acadIdx++).padStart(3, '0')}`;
    const plan = mapPlanTier(d.pricing_plan);
    const maxStudents = Number(d.use_count) > 0 ? Number(d.use_count) : 50;
    const monthlyFee = Number(d.pricing_price) > 0 ? Number(d.pricing_price) : 330000;
    const startDate = parseSafeDate(d.start_date, new Date('2025-01-01'));
    const endDate = parseSafeDate(d.end_date ?? d.service_end_date, new Date('2027-12-31'));

    const acad = await prisma.academy.create({
      data: {
        code,
        name: grpName,
        directorName: String(d.user_name ?? '원장'),
        phone: String(d.cell_no ?? '010-0000-0000'),
        email: d.email ? String(d.email) : null,
        address: d.address ? String(d.address) : null,
        bizNo: d.business_no ? String(d.business_no) : null,
        plan,
        maxStudents,
        monthlyFee,
        startDate,
        endDate,
        memo: d.memo ? String(d.memo) : null,
        legacySeq: dSeq,
      },
    });
    academyMap.set(grpName, acad.id);
  }

  // 추가 학생 소속 학원명 보완
  for (const u of T.tb_user) {
    const grp = String(u.group_name ?? '').trim();
    if (grp && !academyMap.has(grp)) {
      const code = `ACAD-${String(acadIdx++).padStart(3, '0')}`;
      const acad = await prisma.academy.create({
        data: {
          code,
          name: grp,
          directorName: `${grp} 원장`,
          phone: '010-0000-0000',
          plan: PlanTier.STANDARD,
          maxStudents: 50,
          monthlyFee: 330000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2027-12-31'),
          status: AcademyStatus.ACTIVE,
          memo: '학생 소속 학원명 자동 보완',
        },
      });
      academyMap.set(grp, acad.id);
    }
  }
  console.log(`   ✅ 가맹 학원 ${academyMap.size}개소 생성 완료.`);

  // 클래스(ClassGroup) 생성
  const classMap = new Map<string, string>();
  for (const u of T.tb_user) {
    const cName = String(u.class_name ?? '').trim();
    if (!cName) continue;
    const grp = String(u.group_name ?? '').trim();
    const acadId = academyMap.get(grp) || hqAcademy.id;
    const key = `${acadId}:${cName}`;

    if (!classMap.has(key)) {
      const cls = await prisma.classGroup.create({
        data: {
          academyId: acadId,
          name: cName,
          targetGrade: u.grade ? mapGrade(u.grade) : null,
        },
      });
      classMap.set(key, cls.id);
    }
  }
  console.log(`   ✅ 분반/클래스 ${classMap.size}개 생성 완료.\n`);

  // 5. 통합 회원 (Member) 고속 적재
  console.log('👥 5/7. 통합 회원(Member) 적재 중 (비밀번호: nano123!)...');
  const membersData = T.tb_user.map((u) => {
    const username = String(u.user_id).trim();
    const uSeq = Number(u.user_seq);
    const name = String(u.user_name ?? username);
    const uType = String(u.user_type);

    let role: Role = Role.STUDENT;
    if (uType === 'director') role = Role.DIRECTOR;
    else if (uType === 'teacher') role = Role.TEACHER;
    else if (uType === 'master' || uType === 'admin') role = Role.MASTER;

    const grp = String(u.group_name ?? '').trim();
    const acadId = academyMap.get(grp) || hqAcademy.id;
    const cName = String(u.class_name ?? '').trim();
    const classGroupId = cName ? classMap.get(`${acadId}:${cName}`) || null : null;

    const gender = u.gender === 'F' ? '여' : u.gender === 'M' ? '남' : null;
    const phone = u.cell_no ? String(u.cell_no) : '010-0000-0000';
    const parentName = u.parent_name ? String(u.parent_name) : null;
    const parentPhone = u.parent_cell ? String(u.parent_cell) : null;
    const parentEmail = u.email ? String(u.email) : null;
    const points = Number(u.point) || 0;
    const lastLoginAt = parseSafeDate(u.last_login_time, null);

    return {
      academyId: acadId,
      classGroupId,
      role,
      name,
      username,
      password: DEFAULT_PASSWORD,
      gender,
      grade: mapGrade(u.grade),
      phone,
      parentName,
      parentPhone,
      parentEmail,
      points,
      status: MemberStatus.APPROVED,
      lastLoginAt,
      legacySeq: uSeq,
    };
  });

  for (const mBatch of chunk(membersData, 500)) {
    await prisma.member.createMany({ data: mBatch, skipDuplicates: true });
  }

  const allMembers = await prisma.member.findMany({ select: { id: true, username: true } });
  const memberIdMap = new Map<string, string>();
  for (const m of allMembers) memberIdMap.set(m.username, m.id);
  console.log(`   ✅ 통합 회원 ${memberIdMap.size}명 적재 완료.\n`);

  // 6. 학습 이력 (QuizAttempt) & 포인트 (PointHistory)
  console.log('📝 6/7. 최근 3개월 학습 이력(QuizAttempt) 대량 적재 중...');
  const attemptsData: Array<{
    memberId: string;
    bookId: string;
    score: number;
    correctCount: number;
    questionCount: number;
    thinkReply: string | null;
    thinkReplyFile: string | null;
    answers: any;
    completedAt: Date;
    legacyQhSeq: number;
  }> = [];

  for (const qh of T.tb_quiz_history) {
    const uId = String(qh.user_id).trim();
    const bNo = String(qh.book_no).trim();
    const memberId = memberIdMap.get(uId);
    const bookId = bookIdMap.get(bNo);
    if (!memberId || !bookId) continue;

    const qhSeq = Number(qh.qh_seq);
    const score = Number(qh.score) || 0;
    const correctCount = Number(qh.correct_cnt) || 0;
    const questionCount = Number(qh.quiz_cnt) || 5;
    const thinkReply = qh.think_reply ? String(qh.think_reply) : null;
    const thinkReplyFile = qh.think_reply_file ? String(qh.think_reply_file) : null;
    const completedAt = parseSafeDate(qh.reg_date, new Date())!;
    const parsedAns = tryPhpUnserialize(String(qh.quiz_answer_result ?? '')) || {};

    attemptsData.push({
      memberId,
      bookId,
      score,
      correctCount,
      questionCount,
      thinkReply,
      thinkReplyFile,
      answers: parsedAns,
      completedAt,
      legacyQhSeq: qhSeq,
    });
  }

  for (const aBatch of chunk(attemptsData, 500)) {
    await prisma.quizAttempt.createMany({ data: aBatch, skipDuplicates: true });
  }
  console.log(`   ✅ 최근 3개월 학습 이력 ${attemptsData.length}건 적재 완료.`);

  // 학생별 누적 완독 권수 및 평균 점수 동기화
  console.log('   - 학생 누적 완독 권수(bookCount) 및 평균 점수(quizAvg) 집계 중...');
  const memberQuizStats = await prisma.quizAttempt.groupBy({
    by: ['memberId'],
    _count: { id: true },
    _avg: { score: true },
  });
  for (const st of memberQuizStats) {
    await prisma.member.update({
      where: { id: st.memberId },
      data: {
        bookCount: st._count.id,
        quizAvg: Math.round((st._avg.score || 0) * 10) / 10,
      },
    });
  }
  console.log(`   ✅ 학생 ${memberQuizStats.length}명 완독 통계 동기화 완료.`);

  // 포인트 이력 적재
  console.log('   - 최근 3개월 포인트 이력(PointHistory) 대량 적재 중...');
  const pointsData: Array<{
    memberId: string;
    amount: number;
    pointType: string | null;
    content: string | null;
    createdAt: Date;
    legacyPhSeq: number;
  }> = [];

  for (const ph of T.tb_point_history) {
    const uId = String(ph.user_id).trim();
    const memberId = memberIdMap.get(uId);
    if (!memberId) continue;

    const phSeq = Number(ph.ph_seq);
    const amount = Number(ph.point) || 0;
    const pointType = ph.point_type ? String(ph.point_type) : 'QUIZ';
    const content = ph.content ? String(ph.content) : '북퀴즈 풀이 적립';
    const createdAt = parseSafeDate(ph.reg_date, new Date())!;

    pointsData.push({
      memberId,
      amount,
      pointType,
      content,
      createdAt,
      legacyPhSeq: phSeq,
    });
  }

  for (const pBatch of chunk(pointsData, 500)) {
    await prisma.pointHistory.createMany({ data: pBatch, skipDuplicates: true });
  }
  console.log(`   ✅ 최근 3개월 포인트 내역 ${pointsData.length}건 적재 완료.\n`);

  // 7. 학원 보유 도서 (AcademyBook)
  console.log('📚 7/7. 학원 보유 도서(AcademyBook) 대량 적재 중...');
  const acadBooksData: Array<{ academyId: string; bookId: string }> = [];
  const seenPair = new Set<string>();

  for (const bl of T.tb_book_list) {
    const grp = String(bl.group_name ?? '').trim();
    const bNo = String(bl.book_no ?? '').trim();
    const acadId = academyMap.get(grp);
    const bookId = bookIdMap.get(bNo);
    if (!acadId || !bookId) continue;

    const pairKey = `${acadId}:${bookId}`;
    if (!seenPair.has(pairKey)) {
      seenPair.add(pairKey);
      acadBooksData.push({ academyId: acadId, bookId });
    }
  }

  for (const abBatch of chunk(acadBooksData, 500)) {
    await prisma.academyBook.createMany({ data: abBatch, skipDuplicates: true });
  }
  console.log(`   ✅ 학원 보유 도서 ${acadBooksData.length}건 연결 완료.\n`);

  // 최종 요약
  console.log('🎉 =========================================================');
  console.log('🎉 [나노의책장] 데이터 이관이 성공적으로 완료되었습니다!');
  console.log('🎉 =========================================================');
  console.log(`   - 가맹 학원(Academy): ${academyMap.size}개소`);
  console.log(`   - 통합 회원(Member): ${memberIdMap.size}명 (원장, 교사, 학생 정상 계정)`);
  console.log(`   - 도서 목록(Book): ${bookIdMap.size}권`);
  console.log(`   - 북퀴즈 문항(BookQuiz): ${totalQuizzesInserted}개 문항`);
  console.log(`   - 최근 3개월 학습 이력(QuizAttempt): ${attemptsData.length}건`);
  console.log(`   - 최근 3개월 포인트 내역(PointHistory): ${pointsData.length}건`);
  console.log(`   - 학원 보유 도서(AcademyBook): ${acadBooksData.length}건`);
  console.log(`   - 회원 초기 비밀번호: ${DEFAULT_PASSWORD}`);
  console.log('=========================================================\n');
}

runMigration()
  .catch((e) => {
    console.error('❌ 이관 중 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
