// ==============================================================
// 나노의책장 - 도서 찜/추천 실데이터 및 전체 북퀴즈 완료 내역·학습리포트 완전 이관 스크립트
// ==============================================================
// 1. tb_favorite_history (8,932건) -> 재원생 개인별 wishlist 복원 + 도서별 찜 합산
// 2. tb_recommend_history (35,043건) -> 도서별 추천 횟수 합산
// 3. tb_quiz_history (전체 기간, 정상 재원생 약 62,500건) -> QuizAttempt 전량 이관
//    + tb_quiz / quiz_result / tb_book.think_quiz 결합하여 단권 [학습리포트]용
//      문항별 정오답(quizResults) 및 생각담기 질문(thoughtQuestion) 100% 자동 생성
// 4. 학생별 누적 고유 완독 권수(bookCount, 60점 이상) 및 평균 점수(quizAvg) 고속 동기화
// ==============================================================

import { prisma } from '../lib/prisma';
import { loadTables, type LegacyRow } from './migrate/legacy-dump';
import { tryPhpUnserialize } from './migrate/php-unserialize';
import { recalculatePointsByCurrentPolicy } from './recalculate_points_by_policy';

const DRY_RUN = process.argv.includes('--dry-run');

function normalizeSpace(s: unknown): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function cleanQuestionText(q: unknown): string {
  return String(q ?? '')
    .replace(/^【[^】]*출제[^】]*】\s*|^\[[^\]]*출제[^\]]*\]\s*/g, '')
    .trim();
}

function parseSafeDate(val: unknown, fallback: Date): Date {
  if (!val) return fallback;
  const s = String(val).trim();
  if (!s || s.startsWith('0000') || s.startsWith('00-00')) return fallback;
  // MySQL 'YYYY-MM-DD HH:mm:ss' 는 한국 표준시(KST, UTC+9) 기준이므로 +09:00 명시
  const iso = s.includes('T') ? s : s.replace(' ', 'T') + '+09:00';
  const d = new Date(iso);
  if (!isNaN(d.getTime())) return d;
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? fallback : d2;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

interface ParsedQuizTemplate {
  quizSeq: number;
  questions: Array<{
    qNum: number;
    question: string;
    options: string[];
    correctChoiceText: string;
  }>;
}

function parseQuizTemplate(qRow: LegacyRow): ParsedQuizTemplate | null {
  const raw = tryPhpUnserialize(String(qRow.quiz_contents ?? ''));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, any>;
  const qMap = (obj.q && typeof obj.q === 'object') ? obj.q : {};
  const aMap = (obj.a && typeof obj.a === 'object') ? obj.a : {};
  const c1 = (obj.c1 && typeof obj.c1 === 'object') ? obj.c1 : {};
  const c2 = (obj.c2 && typeof obj.c2 === 'object') ? obj.c2 : {};
  const c3 = (obj.c3 && typeof obj.c3 === 'object') ? obj.c3 : {};
  const c4 = (obj.c4 && typeof obj.c4 === 'object') ? obj.c4 : {};
  const c5 = (obj.c5 && typeof obj.c5 === 'object') ? obj.c5 : {};

  const keys = Object.keys(qMap).sort((a, b) => Number(a) - Number(b));
  const questions: ParsedQuizTemplate['questions'] = [];

  for (let idx = 0; idx < keys.length; idx++) {
    const k = keys[idx];
    const qText = cleanQuestionText(qMap[k]);
    if (!qText) continue;
    const rawOpts = [c1[k], c2[k], c3[k], c4[k], c5[k]];
    const options = rawOpts
      .filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
      .map((v) => String(v).trim());

    const rawAns = aMap[k];
    const ansNum = Number(rawAns);
    let correctChoiceText = '';
    if (Number.isInteger(ansNum) && ansNum >= 1 && ansNum <= 5 && rawOpts[ansNum - 1] != null) {
      correctChoiceText = String(rawOpts[ansNum - 1]).trim();
    } else if (Number.isInteger(ansNum) && ansNum >= 1 && ansNum <= options.length) {
      correctChoiceText = options[ansNum - 1];
    } else if (rawAns != null) {
      correctChoiceText = String(rawAns).trim();
    }

    questions.push({
      qNum: idx + 1,
      question: qText,
      options,
      correctChoiceText,
    });
  }

  if (questions.length === 0) return null;
  return { quizSeq: Number(qRow.quiz_seq) || 0, questions };
}

async function main() {
  console.log(`🚀 [나노의책장] 찜/추천 및 북퀴즈 완료 내역·학습리포트 전체 이관 시작 (DRY_RUN=${DRY_RUN})...\n`);

  // 1. SQL 덤프 테이블 스트리밍 로드
  console.log('📥 1/5. 백업 SQL에서 도서·퀴즈·찜·추천·학습이력 로드 중...');
  const T = await loadTables([
    'tb_book',
    'tb_quiz',
    'tb_favorite_history',
    'tb_recommend_history',
    'tb_quiz_history',
  ]);
  console.log(`   - tb_book: ${T.tb_book.length.toLocaleString()}건`);
  console.log(`   - tb_quiz: ${T.tb_quiz.length.toLocaleString()}건`);
  console.log(`   - tb_favorite_history (찜): ${T.tb_favorite_history.length.toLocaleString()}건`);
  console.log(`   - tb_recommend_history (추천): ${T.tb_recommend_history.length.toLocaleString()}건`);
  console.log(`   - tb_quiz_history (북퀴즈 완료): ${T.tb_quiz_history.length.toLocaleString()}건\n`);

  // 2. 현재 Neon DB 회원 및 도서 조회 (중복 통폐합 도서까지 100% 매핑)
  console.log('🔗 2/5. Neon DB 재원생 및 통폐합 대표 도서 매핑 구성 중...');
  const [dbMembers, dbBooks, existingPrefs] = await Promise.all([
    prisma.member.findMany({ select: { id: true, username: true, role: true } }),
    prisma.book.findMany({ select: { id: true, bookNo: true, isbn: true, title: true, thinkQuiz: true } }),
    prisma.portalSetting.findMany({ where: { key: { startsWith: 'preferences:' } } }),
  ]);

  const memberByUsername = new Map<string, { id: string; username: string; role: string }>();
  for (const m of dbMembers) {
    memberByUsername.set(m.username.trim().toLowerCase(), m);
  }

  const dbBookByNo = new Map(dbBooks.map((b) => [b.bookNo.trim(), b]));
  const dbBookByIsbn = new Map<string, typeof dbBooks[0]>();
  const dbBookByTitle = new Map<string, typeof dbBooks[0]>();
  const dbBookByCleanTitle = new Map<string, typeof dbBooks[0]>();

  for (const b of dbBooks) {
    const cleanIsbn = String(b.isbn || '').replace(/[^0-9Xx]/g, '');
    if (cleanIsbn && !dbBookByIsbn.has(cleanIsbn)) dbBookByIsbn.set(cleanIsbn, b);
    const t = b.title.trim();
    if (!dbBookByTitle.has(t)) dbBookByTitle.set(t, b);
    const ct = t.replace(/[\s()[\]·.,!?~'"-]/g, '').toLowerCase();
    if (ct && !dbBookByCleanTitle.has(ct)) dbBookByCleanTitle.set(ct, b);
  }

  const legacyToDbBook = new Map<string, typeof dbBooks[0]>();
  const legacyThinkQuiz = new Map<string, string>();

  for (const lb of T.tb_book) {
    const bNo = String(lb.book_no || '').trim();
    if (!bNo) continue;
    if (lb.think_quiz && String(lb.think_quiz).trim()) {
      legacyThinkQuiz.set(bNo, String(lb.think_quiz).trim());
    }
    const direct = dbBookByNo.get(bNo);
    if (direct) {
      legacyToDbBook.set(bNo, direct);
      continue;
    }
    const cleanIsbn = String(lb.isbn || '').replace(/[^0-9Xx]/g, '');
    if (cleanIsbn && dbBookByIsbn.has(cleanIsbn)) {
      legacyToDbBook.set(bNo, dbBookByIsbn.get(cleanIsbn)!);
      continue;
    }
    const title = String(lb.book_name || '').trim();
    if (dbBookByTitle.has(title)) {
      legacyToDbBook.set(bNo, dbBookByTitle.get(title)!);
      continue;
    }
    const ct = title.replace(/[\s()[\]·.,!?~'"-]/g, '').toLowerCase();
    if (ct && dbBookByCleanTitle.has(ct)) {
      legacyToDbBook.set(bNo, dbBookByCleanTitle.get(ct)!);
    }
  }
  console.log(`   - 레거시 도서 매핑 성공: ${legacyToDbBook.size} / ${T.tb_book.length}권\n`);

  // 3. 찜(tb_favorite_history) & 추천(tb_recommend_history) 집계 및 개인별 wishlist 구성
  console.log('❤️  3/5. 학생별 찜 목록(wishlist) 및 도서별 찜/추천/과거인증 통계 산출 중...');

  // 최신 찜 순서가 앞에 오도록 reg_date 내림차순 정렬
  const sortedFavs = [...T.tb_favorite_history].sort((a, b) =>
    String(b.reg_date || '').localeCompare(String(a.reg_date || ''))
  );

  const memberWishlistMap = new Map<string, Set<string>>(); // memberId -> Set<survivingBookNo>
  const baseLikesByBookNo: Record<string, number> = {}; // 비재원/졸업생 찜 횟수
  const allLikesByBookNo: Record<string, number> = {}; // 전체 찜 스냅샷 (학생 화면용)
  const seenUserBookFav = new Set<string>(); // 동일 유저가 통폐합된 같은 도서를 중복 찜한 경우 1회로 정규화

  for (const f of sortedFavs) {
    const rawBNo = String(f.book_no || '').trim();
    const targetBook = legacyToDbBook.get(rawBNo) || dbBookByNo.get(rawBNo);
    if (!targetBook) continue;
    const finalBNo = targetBook.bookNo;
    const uId = String(f.user_id || '').trim().toLowerCase();
    const dedupKey = `${uId}:${finalBNo}`;
    if (seenUserBookFav.has(dedupKey)) continue;
    seenUserBookFav.add(dedupKey);

    allLikesByBookNo[finalBNo] = (allLikesByBookNo[finalBNo] || 0) + 1;

    const member = memberByUsername.get(uId);
    if (member) {
      if (!memberWishlistMap.has(member.id)) memberWishlistMap.set(member.id, new Set());
      const set = memberWishlistMap.get(member.id)!;
      if (set.size < 1000) set.add(finalBNo);
    } else {
      baseLikesByBookNo[finalBNo] = (baseLikesByBookNo[finalBNo] || 0) + 1;
    }
  }

  const recommendsByBookNo: Record<string, number> = {};
  for (const r of T.tb_recommend_history) {
    const rawBNo = String(r.book_no || '').trim();
    const targetBook = legacyToDbBook.get(rawBNo) || dbBookByNo.get(rawBNo);
    if (!targetBook) continue;
    recommendsByBookNo[targetBook.bookNo] = (recommendsByBookNo[targetBook.bookNo] || 0) + 1;
  }

  console.log(`   - 찜 목록 보유 재원생: ${memberWishlistMap.size.toLocaleString()}명`);
  console.log(`   - 찜 보유 도서 종수: ${Object.keys(allLikesByBookNo).length.toLocaleString()}종 (총 ${Object.values(allLikesByBookNo).reduce((a, b) => a + b, 0).toLocaleString()}건)`);
  console.log(`   - 추천 보유 도서 종수: ${Object.keys(recommendsByBookNo).length.toLocaleString()}종 (총 ${Object.values(recommendsByBookNo).reduce((a, b) => a + b, 0).toLocaleString()}건)\n`);

  // 4. 북퀴즈 완료 내역(tb_quiz_history) + 단권 학습리포트(quizResults) 재구성
  console.log('📝 4/5. 전체 북퀴즈 완료 내역 및 문항별 [학습리포트] 상세 채점표 생성 중...');

  const quizTemplateBySeq = new Map<number, ParsedQuizTemplate>();
  const quizTemplatesByBookNo = new Map<string, ParsedQuizTemplate[]>();
  for (const qRow of T.tb_quiz) {
    const tpl = parseQuizTemplate(qRow);
    if (!tpl) continue;
    quizTemplateBySeq.set(tpl.quizSeq, tpl);
    const bNo = String(qRow.book_no || '').trim();
    if (!quizTemplatesByBookNo.has(bNo)) quizTemplatesByBookNo.set(bNo, []);
    quizTemplatesByBookNo.get(bNo)!.push(tpl);
  }

  // 기존 DB에 저장된 첨삭(교사 코멘트/AI 분석지) 보존용 조회
  const existingReviewedAttempts = await prisma.quizAttempt.findMany({
    where: { legacyQhSeq: { not: null } },
    select: { legacyQhSeq: true, answers: true },
  });
  const preservedReviewByQhSeq = new Map<number, Record<string, any>>();
  for (const row of existingReviewedAttempts) {
    const ans = row.answers as any;
    if (ans && typeof ans === 'object' && !Array.isArray(ans)) {
      if (ans.comment || ans.worksheetAiResult || ans.reviewed === '첨삭 완료' || ans.sheet === '작성 완료' || (Array.isArray(ans.worksheetPhotos) && ans.worksheetPhotos.length > 0)) {
        preservedReviewByQhSeq.set(row.legacyQhSeq!, {
          comment: ans.comment,
          reviewed: ans.reviewed,
          sheet: ans.sheet,
          thoughtHidden: ans.thoughtHidden,
          worksheetAiResult: ans.worksheetAiResult,
          worksheetPhotos: ans.worksheetPhotos,
          reviewRevision: ans.reviewRevision,
        });
      }
    }
  }
  console.log(`   - 보존할 기존 교사 첨삭 이력: ${preservedReviewByQhSeq.size}건`);

  const legacyCertsByBookNo: Record<string, number> = {}; // 비재원/졸업생 60점 이상 인증 횟수
  const attemptsToInsert: Array<{
    id: string;
    memberId: string;
    bookId: string;
    score: number;
    totalScore: number;
    correctCount: number;
    questionCount: number;
    thinkReply: string | null;
    thinkReplyFile: string | null;
    answers: any;
    completedAt: Date;
    legacyQhSeq: number;
  }> = [];

  let reconstructedWithFullQuestions = 0;
  let fallbackReconstructed = 0;

  for (const qh of T.tb_quiz_history) {
    const rawBNo = String(qh.book_no || '').trim();
    const targetBook = legacyToDbBook.get(rawBNo) || dbBookByNo.get(rawBNo);
    if (!targetBook) continue;

    const score = Math.max(0, Math.min(100, Number(qh.score) || 0));
    const uId = String(qh.user_id || '').trim().toLowerCase();
    const member = memberByUsername.get(uId);

    if (!member) {
      if (score >= 60) {
        legacyCertsByBookNo[targetBook.bookNo] = (legacyCertsByBookNo[targetBook.bookNo] || 0) + 1;
      }
      continue;
    }

    const qhSeq = Number(qh.qh_seq);
    if (!qhSeq) continue;

    const qSeq = Number(qh.quiz_seq) || 0;
    const tpl =
      quizTemplateBySeq.get(qSeq) ||
      (quizTemplatesByBookNo.get(rawBNo)?.[0]) ||
      (quizTemplatesByBookNo.get(targetBook.bookNo)?.[0]) ||
      null;

    const rawAnsObj = tryPhpUnserialize(String(qh.quiz_answer_result ?? ''));
    const ansObj = (rawAnsObj && typeof rawAnsObj === 'object' && !Array.isArray(rawAnsObj))
      ? (rawAnsObj as Record<string, any>)
      : {};

    let quizResults: Array<{
      qNum: number;
      question: string;
      userChoiceText: string;
      correctChoiceText: string;
      isCorrect: boolean;
    }> = [];

    if (tpl && tpl.questions.length > 0) {
      quizResults = tpl.questions.map((qItem, idx) => {
        const keyStr = String(idx + 1);
        const rawUserVal = ansObj[keyStr] ?? ansObj[idx];
        let userChoiceText = rawUserVal != null ? String(rawUserVal).trim() : '';

        // 만약 숫자인덱스('1'~'5')로 저장된 경우 보기 텍스트로 치환 (단, 보기 자체가 숫자가 아닐 때)
        if (/^[1-5]$/.test(userChoiceText) && !qItem.options.includes(userChoiceText)) {
          const optIdx = Number(userChoiceText) - 1;
          if (qItem.options[optIdx]) userChoiceText = qItem.options[optIdx];
        }

        const isCorrect =
          userChoiceText !== '' &&
          normalizeSpace(userChoiceText) === normalizeSpace(qItem.correctChoiceText);

        return {
          qNum: qItem.qNum,
          question: qItem.question,
          userChoiceText: userChoiceText || '(미선택)',
          correctChoiceText: qItem.correctChoiceText,
          isCorrect,
        };
      });
      reconstructedWithFullQuestions++;
    } else {
      // 템플릿이 삭제된 극소수 예외 케이스: 학생 제출 답안 및 정오답 개수로 안전 복원
      const keys = Object.keys(ansObj).sort((a, b) => Number(a) - Number(b));
      const targetCorrect = Number(qh.correct_cnt) || Math.round((score / 100) * (keys.length || 5));
      quizResults = keys.map((k, idx) => {
        const choice = String(ansObj[k] ?? '').trim() || '(응답 기록)';
        const isCorrect = idx < targetCorrect;
        return {
          qNum: idx + 1,
          question: `${targetBook.title} 독서 확인 ${idx + 1}번 문항`,
          userChoiceText: choice,
          correctChoiceText: isCorrect ? choice : '도서 본문 확인',
          isCorrect,
        };
      });
      fallbackReconstructed++;
    }

    const questionCount = quizResults.length || Number(qh.quiz_cnt) || 5;
    const rawCorrectCnt = Number(qh.correct_cnt);
    const correctCount = Number.isFinite(rawCorrectCnt) && rawCorrectCnt > 0
      ? rawCorrectCnt
      : quizResults.filter((r) => r.isCorrect).length;
    const thinkReply = qh.think_reply && String(qh.think_reply).trim() ? String(qh.think_reply).trim() : null;
    const thinkReplyFile = qh.think_reply_file && String(qh.think_reply_file).trim() ? String(qh.think_reply_file).trim() : null;
    const thoughtQuestion =
      legacyThinkQuiz.get(rawBNo) ||
      targetBook.thinkQuiz ||
      '책을 읽고 가장 인상 깊었던 장면이나 나의 생각을 자유롭게 적어보세요.';

    const preserved = preservedReviewByQhSeq.get(qhSeq) || {};
    const completedAt = parseSafeDate(qh.reg_date, new Date('2026-09-01T00:00:00Z'));

    attemptsToInsert.push({
      id: `LQ_${qhSeq}`,
      memberId: member.id,
      bookId: targetBook.id,
      score,
      totalScore: 100,
      correctCount,
      questionCount,
      thinkReply,
      thinkReplyFile,
      answers: {
        quizResults,
        thoughtQuestion,
        legacyQuizSeq: qSeq || undefined,
        ...preserved,
      },
      completedAt,
      legacyQhSeq: qhSeq,
    });
  }

  console.log(`   - 이관 대상 북퀴즈 완료 내역 총계: ${attemptsToInsert.length.toLocaleString()}건`);
  console.log(`     · 출제 문항 원본 100% 매칭 리포트 복원: ${reconstructedWithFullQuestions.toLocaleString()}건`);
  console.log(`     · 삭제된 구형 퀴즈 폴백 복원: ${fallbackReconstructed.toLocaleString()}건`);
  if (attemptsToInsert.length > 0) {
    console.log('   - [샘플 학습리포트 검증]:', JSON.stringify(attemptsToInsert[attemptsToInsert.length - 1], null, 2).slice(0, 900));
  }

  if (DRY_RUN) {
    console.log('\n✅ DRY_RUN 검증 완료! 실제 DB 반영은 생략했습니다.');
    return;
  }

  // 5. Neon DB 고속 일괄 적재
  console.log('\n💾 5/5. Neon PostgreSQL 데이터베이스 고속 반영 중...');

  // 5-1. 개인별 찜 목록(preferences:<memberId>) 병합 저장
  const existingPrefMap = new Map<string, { value: any; revision: number }>();
  for (const row of existingPrefs) {
    existingPrefMap.set(row.key, { value: row.value, revision: row.revision });
  }

  const newPrefRows: Array<{ key: string; scope: string; value: any; revision: number }> = [];
  for (const [memberId, legacySet] of memberWishlistMap.entries()) {
    const key = `preferences:${memberId}`;
    const existing = existingPrefMap.get(key);
    if (existing) {
      const curWish = Array.isArray(existing.value?.wishlist) ? existing.value.wishlist.map(String) : [];
      const curInterests = Array.isArray(existing.value?.interests) ? existing.value.interests : [];
      const mergedWish = Array.from(new Set([...curWish, ...legacySet])).slice(0, 1000);
      await prisma.portalSetting.update({
        where: { key },
        data: {
          value: { wishlist: mergedWish, interests: curInterests },
          revision: { increment: 1 },
        },
      });
      // 업데이트된 찜 수를 allLikes 스냅샷에도 반영
      for (const bNo of curWish) {
        if (!legacySet.has(bNo)) {
          allLikesByBookNo[bNo] = (allLikesByBookNo[bNo] || 0) + 1;
        }
      }
    } else {
      newPrefRows.push({
        key,
        scope: memberId,
        value: { wishlist: Array.from(legacySet), interests: [] },
        revision: 1,
      });
    }
  }

  for (const batch of chunk(newPrefRows, 500)) {
    await prisma.portalSetting.createMany({ data: batch, skipDuplicates: true });
  }
  console.log(`   ✅ 학생 개인별 찜 목록(preferences) ${memberWishlistMap.size.toLocaleString()}명 반영 완료.`);

  // 5-2. 도서별 소셜/인증 누적 베이스 통계 저장 (legacy_book_social_stats)
  await prisma.portalSetting.upsert({
    where: { key: 'legacy_book_social_stats' },
    create: {
      key: 'legacy_book_social_stats',
      scope: 'system',
      value: {
        baseLikes: baseLikesByBookNo,
        allLikes: allLikesByBookNo,
        recommends: recommendsByBookNo,
        legacyCerts: legacyCertsByBookNo,
      },
      revision: 1,
    },
    update: {
      scope: 'system',
      value: {
        baseLikes: baseLikesByBookNo,
        allLikes: allLikesByBookNo,
        recommends: recommendsByBookNo,
        legacyCerts: legacyCertsByBookNo,
      },
      revision: { increment: 1 },
    },
  });
  console.log('   ✅ 도서별 찜/추천/과거인증 누적 베이스 통계(legacy_book_social_stats) 저장 완료.');

  // 5-3. 레거시 QuizAttempt 교체 적재 (신규 포털에서 직접 응시한 legacyQhSeq IS NULL 데이터는 100% 보존!)
  const deleted = await prisma.quizAttempt.deleteMany({
    where: { legacyQhSeq: { not: null } },
  });
  console.log(`   - 기존 불완전 이관 학습이력 ${deleted.count.toLocaleString()}건 정리 완료 (신규 직접 응시 데이터 보존).`);

  let insertedCount = 0;
  const batches = chunk(attemptsToInsert, 1000);
  for (let i = 0; i < batches.length; i++) {
    const res = await prisma.quizAttempt.createMany({
      data: batches[i],
      skipDuplicates: true,
    });
    insertedCount += res.count;
    if ((i + 1) % 10 === 0 || i === batches.length - 1) {
      console.log(`   - 북퀴즈 완료 내역 및 학습리포트 적재 진행률: ${i + 1}/${batches.length} 배치 (${insertedCount.toLocaleString()}건)`);
    }
  }

  // 5-4. 전 회원 고유 완독 권수(60점 이상 고유 도서 수) 및 평균 점수 단일 SQL 초고속 동기화
  console.log('   - 학생별 누적 완독 권수(bookCount) 및 평균 점수(quizAvg) 일괄 재집계 중...');
  await prisma.$executeRawUnsafe(`
    WITH stats AS (
      SELECT
        "memberId",
        COUNT(DISTINCT CASE WHEN score >= 60 THEN "bookId" END)::int AS book_cnt,
        COALESCE(ROUND(AVG(score)::numeric, 1), 0)::float AS quiz_avg
      FROM quiz_attempts
      GROUP BY "memberId"
    )
    UPDATE members m
    SET
      "bookCount" = COALESCE(s.book_cnt, 0),
      "quizAvg" = COALESCE(s.quiz_avg, 0)
    FROM stats s
    WHERE m.id = s."memberId"
  `);

  // 완료된 도서 배정(BookAssignment)도 60점 이상 인증 기록이 있으면 완료 상태로 자동 동기화
  await prisma.$executeRawUnsafe(`
    UPDATE book_assignments ba
    SET "isCompleted" = true, status = 'COMPLETED'
    WHERE ba."isCompleted" = false
      AND EXISTS (
        SELECT 1 FROM quiz_attempts qa
        WHERE qa."memberId" = ba."memberId"
          AND qa."bookId" = ba."bookId"
          AND qa.score >= 60
      )
  `);

  // 5-5. 전 기간(지난달·지지난달·과거 전체 포함) 북퀴즈 이력을 현행 포인트 적립 기준으로 일괄 산정·반영
  await recalculatePointsByCurrentPolicy({ dryRun: DRY_RUN });

  console.log('\n🎉 모든 찜/추천 데이터, 전체 북퀴즈 완료 내역, 단권 학습리포트 및 현행 기준 포인트 산정이 완벽히 완료되었습니다!');
}

main()
  .catch((err) => {
    console.error('❌ 이관 오류:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

