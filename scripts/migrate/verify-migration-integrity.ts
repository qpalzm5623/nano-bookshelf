// ==============================================================
// 나노의책장 - 마이그레이션 사후 무결성 10대 자동 검증기 (Read-Only)
// ==============================================================
// 실행 방법: npm run migrate:verify
// 마이그레이션 직후 이전에 겪었던 모든 정합성 이슈가 재발하지 않았는지
// 데이터베이스와 정적 자산을 전수 검사합니다.
// ==============================================================

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { prisma } from '../../lib/prisma';

export interface CheckResult {
  no: number;
  title: string;
  passed: boolean;
  detail: string;
}

export async function verifyMigrationIntegrity(): Promise<boolean> {
  console.log('\n🔎 =============================================================');
  console.log('🔎 [나노의책장] 마이그레이션 무결성 10대 자동 진단 시작');
  console.log('🔎 =============================================================\n');

  const results: CheckResult[] = [];

  // 1. 회원 비밀번호 scrypt 해싱 100% 여부 (평문 비밀번호 0건 검증)
  const [totalMembers, membersWithoutScrypt, masterCount] = await Promise.all([
    prisma.member.count(),
    prisma.member.count({
      where: {
        OR: [
          { password: null },
          { NOT: { password: { startsWith: 'scrypt:' } } }
        ]
      }
    }),
    prisma.member.count({ where: { role: 'MASTER', status: 'APPROVED' } })
  ]);

  results.push({
    no: 1,
    title: '전 회원 비밀번호 보안 해시(scrypt:) 적용 여부',
    passed: totalMembers > 0 && membersWithoutScrypt === 0,
    detail: `전체 회원 ${totalMembers.toLocaleString()}명 중 미해싱(평문/빈값) ${membersWithoutScrypt}명`
  });

  // 2. 본사 총괄 관리자(MASTER) 활성 계정 존재 여부
  results.push({
    no: 2,
    title: '본사 총괄 관리자(MASTER) 로그인 계정 보존 여부',
    passed: masterCount >= 1,
    detail: `승인된 MASTER 계정 ${masterCount}명`
  });

  // 3. 원장(DIRECTOR) 미배정 가맹점 0곳 검증
  const activeAcademies = await prisma.academy.findMany({
    where: { deletedAt: null, status: 'ACTIVE', NOT: { code: 'ACAD-HQ' } },
    select: {
      code: true,
      name: true,
      _count: { select: { members: { where: { role: 'DIRECTOR', status: 'APPROVED' } } } }
    }
  });
  const directorless = activeAcademies.filter(a => a._count.members === 0);

  results.push({
    no: 3,
    title: '가맹 학원별 승인된 원장(DIRECTOR) 계정 완비 여부',
    passed: activeAcademies.length > 0 && directorless.length === 0,
    detail: `활성 가맹점 ${activeAcademies.length}개소 중 원장 미배정 ${directorless.length}개소` +
      (directorless.length > 0 ? ` (${directorless.slice(0, 3).map(d => d.name).join(', ')})` : '')
  });

  // 4. 도서 컬럼 밀림 및 주제 테마(themeId) 매핑 검증
  const [totalBooks, shiftedBooks, themedBooks] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({
      where: {
        OR: [
          { bookNo: '' },
          { bookNo: 'undefined' }
        ]
      }
    }),
    prisma.book.count({ where: { themeId: { not: null } } })
  ]);

  results.push({
    no: 4,
    title: '도서 코드 무결성(컬럼 밀림 0건) 및 주제 테마 연결 상태',
    passed: totalBooks > 0 && shiftedBooks === 0 && themedBooks > 0,
    detail: `총 도서 ${totalBooks.toLocaleString()}권 / 코드 이상 ${shiftedBooks}권 / 테마 연결 ${themedBooks.toLocaleString()}권`
  });

  // 5. 테마 관리 노출 순서(theme_meta:*) 보존 및 숫자형 순서 검증
  const [themes, themeMetaRows] = await Promise.all([
    prisma.themeCategory.findMany({ select: { id: true, name: true } }),
    prisma.portalSetting.findMany({ where: { scope: 'theme_meta' }, select: { key: true, value: true } })
  ]);
  const validOrderedThemes = themeMetaRows.filter(r => typeof (r.value as any)?.order === 'number');

  results.push({
    no: 5,
    title: '테마 관리 노출 순서(theme_meta) 설정 유지 여부',
    passed: themes.length > 0 && validOrderedThemes.length >= themes.length,
    detail: `등록 테마 ${themes.length}개 / 노출 순서 메타 ${validOrderedThemes.length}개`
  });

  // 6. 북퀴즈 문항 적재 및 출제기관 매핑 파일(lib/quiz-authors.json) 검증
  const quizCount = await prisma.bookQuiz.count();
  const quizAuthorsPath = path.join(process.cwd(), 'lib', 'quiz-authors.json');
  let quizAuthorKeys = 0;
  if (fs.existsSync(quizAuthorsPath)) {
    try {
      quizAuthorKeys = Object.keys(JSON.parse(fs.readFileSync(quizAuthorsPath, 'utf8'))).length;
    } catch {}
  }

  results.push({
    no: 6,
    title: '북퀴즈 문항 및 출제기관 매핑(quiz-authors.json) 정상 여부',
    passed: quizCount > 0 && quizAuthorKeys > 0,
    detail: `북퀴즈 문항 ${quizCount.toLocaleString()}건 / 출제기관 시퀀스 매핑 ${quizAuthorKeys.toLocaleString()}건`
  });

  // 7. 도서 찜/추천/과거인증 누적 소셜 통계(legacy_book_social_stats) 검증
  const socialRow = await prisma.portalSetting.findUnique({ where: { key: 'legacy_book_social_stats' } });
  const socialVal = (socialRow?.value || {}) as Record<string, any>;
  const likeBooksCount = Object.keys(socialVal.allLikes || {}).length;
  const recBooksCount = Object.keys(socialVal.recommends || {}).length;

  results.push({
    no: 7,
    title: '도서 찜(하트) 및 추천 누적 통계(legacy_book_social_stats) 보존 여부',
    passed: likeBooksCount > 0 && recBooksCount > 0,
    detail: `찜 집계 도서 ${likeBooksCount.toLocaleString()}종 / 추천 집계 도서 ${recBooksCount.toLocaleString()}종`
  });

  // 8. 북퀴즈 완료 내역(QuizAttempt) 및 단권 [학습리포트] 정오답 상세(quizResults) 생성 검증
  const totalAttempts = await prisma.quizAttempt.count();
  const recentSample = await prisma.quizAttempt.findMany({
    take: 50,
    orderBy: { completedAt: 'desc' },
    select: { id: true, answers: true }
  });
  const validReportCount = recentSample.filter(a => {
    const ans = a.answers as any;
    return ans && Array.isArray(ans.quizResults) && ans.quizResults.length > 0;
  }).length;

  results.push({
    no: 8,
    title: '북퀴즈 완료 내역 및 단권 [학습리포트] 문항별 정오답 데이터 완비 여부',
    passed: totalAttempts > 0 && validReportCount === recentSample.length,
    detail: `전체 응시 내역 ${totalAttempts.toLocaleString()}건 / 최근 샘플 ${recentSample.length}건 중 리포트 유효 ${validReportCount}건`
  });

  // 9. 학생 누적 고유 완독 권수(bookCount) 및 현행 적립 기준 월별·누적 포인트(PointHistory = Member.points) 정합성 대조
  const [mismatchRows, pointHistoryCount, staleLegacyPointCount, pointMismatchRows] = await Promise.all([
    prisma.$queryRawUnsafe<Array<{ cnt: number }>>(`
      WITH actual AS (
        SELECT m.id, m."bookCount",
               COUNT(DISTINCT CASE WHEN qa.score >= 60 THEN qa."bookId" END)::int AS real_cnt
        FROM members m
        LEFT JOIN quiz_attempts qa ON qa."memberId" = m.id
        WHERE m.role = 'STUDENT'
        GROUP BY m.id, m."bookCount"
      )
      SELECT COUNT(*)::int AS cnt FROM actual WHERE "bookCount" <> real_cnt
    `),
    prisma.pointHistory.count(),
    prisma.pointHistory.count({ where: { legacyPhSeq: { not: null } } }),
    prisma.$queryRawUnsafe<Array<{ cnt: number }>>(`
      WITH pt_actual AS (
        SELECT m.id, m.points,
               GREATEST(0, COALESCE(SUM(ph.amount), 0))::int AS real_pts
        FROM members m
        LEFT JOIN point_histories ph ON ph."memberId" = m.id
        WHERE m.role = 'STUDENT'
        GROUP BY m.id, m.points
      )
      SELECT COUNT(*)::int AS cnt FROM pt_actual WHERE points <> real_pts
    `),
  ]);
  const mismatchCount = mismatchRows[0]?.cnt ?? 0;
  const pointMismatchCount = pointMismatchRows[0]?.cnt ?? 0;

  results.push({
    no: 9,
    title: '학생 누적 완독 권수 및 현행 기준 월별·누적 포인트(PointHistory) 정합성',
    passed: mismatchCount === 0 && pointHistoryCount > 0 && staleLegacyPointCount === 0 && pointMismatchCount === 0,
    detail: `완독 권수 불일치 ${mismatchCount}명 / 현행 포인트 내역 ${pointHistoryCount.toLocaleString()}건 / 구형 미전환 ${staleLegacyPointCount}건 / 보유 포인트 불일치 ${pointMismatchCount}명`
  });

  // 10. 정적 폴백 데이터 번들(public_html/migrated_real_data.js) 존재 검증
  const fallbackJsPath = path.join(process.cwd(), 'public_html', 'migrated_real_data.js');
  const fallbackExists = fs.existsSync(fallbackJsPath) && fs.statSync(fallbackJsPath).size > 1000;

  results.push({
    no: 10,
    title: '프론트엔드 폴백 실데이터 번들(migrated_real_data.js) 동기화 여부',
    passed: fallbackExists,
    detail: fallbackExists
      ? `정상 존재 (${Math.round(fs.statSync(fallbackJsPath).size / 1024).toLocaleString()} KB)`
      : '파일 없음 또는 비정상 크기'
  });

  // 결과 출력
  let allPassed = true;
  for (const r of results) {
    const icon = r.passed ? '✅ [PASS]' : '❌ [FAIL]';
    if (!r.passed) allPassed = false;
    console.log(`${icon} ${String(r.no).padStart(2, '0')}. ${r.title}`);
    console.log(`          └─ ${r.detail}`);
  }

  console.log('\n=============================================================');
  if (allPassed) {
    console.log('🎉 [검증 통과] 10개 핵심 무결성 항목이 모두 정상(PASS)입니다!');
  } else {
    console.error('⚠️ [검증 경고] 일부 항목이 기준을 충족하지 못했습니다. 위 로그를 확인해 주세요.');
  }
  console.log('=============================================================\n');

  return allPassed;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  verifyMigrationIntegrity()
    .then((ok) => {
      if (!ok) process.exitCode = 1;
    })
    .catch((err) => {
      console.error('❌ 무결성 검증 중 오류:', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}

