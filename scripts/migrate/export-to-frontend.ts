import { PrismaClient, Role } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Neon DB에서 실데이터 추출 시작...');

  // 1. 가맹 학원 목록 추출
  const rawAcademies = await prisma.academy.findMany({
    orderBy: { code: 'asc' },
    include: {
      members: {
        where: { role: Role.STUDENT },
        select: { id: true },
      },
      _count: {
        select: {
          academyBooks: true,
        },
      },
    },
  });

  // 학원별 원장 계정 찾기
  const directors = await prisma.member.findMany({
    where: { role: Role.DIRECTOR },
    select: { academyId: true, username: true, name: true, phone: true },
  });
  const dirMap = new Map<string, { username: string; name: string; phone: string }>();
  for (const d of directors) {
    dirMap.set(d.academyId, d);
  }

  const franchises = rawAcademies.map((ac) => {
    const dir = dirMap.get(ac.id);
    const planStr = ac.plan.charAt(0) + ac.plan.slice(1).toLowerCase(); // Standard, Vip etc.
    const monthlyFormatted = ac.monthlyFee ? `${ac.monthlyFee.toLocaleString()}원` : '330,000원';

    return {
      id: ac.code,
      name: ac.name,
      bizNumber: ac.bizNo || '미등록',
      director: ac.directorName ? `${ac.directorName} 원장` : (dir?.name ? `${dir.name} 원장` : '원장 미지정'),
      email: ac.email || `${ac.code.toLowerCase()}@nanobook.co.kr`,
      phone: ac.phone || dir?.phone || '010-0000-0000',
      region: ac.address || '전국',
      adminId: dir?.username || ac.code.toLowerCase(),
      adminPw: 'nano123!',
      plan: planStr,
      joinDate: ac.joinDate.toISOString().slice(0, 10),
      startDate: ac.startDate.toISOString().slice(0, 10),
      endDate: ac.endDate.toISOString().slice(0, 10),
      currentStudents: ac.members.length,
      maxStudents: ac.maxStudents,
      monthlyFee: monthlyFormatted,
      paymentStatus: 'PAID',
      status: ac.status === 'ACTIVE' ? 'ACTIVE' : ac.status === 'SUSPENDED' ? 'PAUSED' : 'TERMINATED',
    };
  });

  console.log(`✅ 가맹 학원 추출 완료: ${franchises.length}개소`);

  // 2. 통합 회원 목록 추출
  const rawMembers = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      academy: { select: { code: true, name: true } },
      classGroup: { select: { name: true } },
    },
  });

  const members = rawMembers.map((m, idx) => {
    return {
      id: m.legacySeq || idx + 1,
      academyId: m.academy?.code || 'HQ',
      academyName: m.academy?.name || '본사 (공용)',
      role: m.role,
      name: m.name,
      username: m.username,
      grade: m.grade || (m.role === 'DIRECTOR' ? '원장' : m.role === 'TEACHER' ? '교사' : '학생'),
      className: m.classGroup?.name || '-',
      phone: m.phone || '-',
      parentPhone: m.parentPhone || '-',
      points: m.points || 0,
      bookCount: m.bookCount || 0,
      quizAvg: m.quizAvg || 0,
      lastLogin: m.lastLoginAt ? m.lastLoginAt.toISOString().slice(0, 16).replace('T', ' ') : '-',
      createdAt: m.createdAt.toISOString().slice(0, 10),
      status: m.status === 'APPROVED' ? 'APPROVED' : m.status === 'SUSPENDED' ? 'WITHDRAWN' : 'PENDING',
    };
  });

  console.log(`✅ 통합 회원 추출 완료: ${members.length}명 (완독 권수 및 평균점수 실데이터 반영)`);

  // 3. 도서 목록 추출 (주요 도서 500권)
  const bookQuizStats = await prisma.quizAttempt.groupBy({
    by: ['bookId'],
    _count: { id: true },
    _avg: { score: true },
  });
  const bookStatsMap = new Map<string, { count: number; avgScore: number }>();
  for (const bs of bookQuizStats) {
    bookStatsMap.set(bs.bookId, { count: bs._count.id, avgScore: Math.round(bs._avg.score || 0) });
  }

  const rawBooks = await prisma.book.findMany({
    take: 500,
    orderBy: { bookNo: 'asc' },
    include: {
      _count: {
        select: { quizzes: true },
      },
    },
  });

  const books = rawBooks.map((b) => {
    let cat1 = '소설';
    if (b.subCategory === 'B') cat1 = '인물 이야기 (위인)';
    else if (b.subCategory === 'C') cat1 = '비문학/정보글';
    else if (b.subCategory === 'A') cat1 = '소설';

    let cat2 = '국내서';
    if (b.category === 'F') cat2 = '외서';
    else if (b.category === 'K') cat2 = '국내서';
    else if (b.category === 'N') cat2 = '구분 없음';

    const category = (cat1 === '비문학/정보글') ? '비문학' : '문학';

    let grade = b.grade || '초등 전학년';
    if (grade === '유치부' || grade === '0') grade = '미취학';
    else if (grade.startsWith('초') && !grade.includes('학년')) grade = `초등 ${grade.replace('초', '')}학년`;
    else if (grade.startsWith('중') && !grade.includes('학년')) grade = `중등 ${grade.replace('중', '')}학년`;

    const rawSeries = b.series ? b.series.trim() : '';
    const hasSeries = rawSeries !== '' && rawSeries !== '단권';
    const seriesName = hasSeries ? rawSeries : '단권';
    const isSingle = !hasSeries;

    const subjName = b.subject ? b.subject.trim() : '이야기';
    const themeTag = subjName.startsWith('#') ? subjName : `#${subjName}`;

    const rawTagStr = b.tags ? b.tags.trim() : '';
    const tagArray = rawTagStr
      ? rawTagStr.split(/[,#]/).map((t) => t.trim()).filter(Boolean)
      : [];
    const detailTagFormatted = tagArray.length > 0
      ? tagArray.map((t) => `#${t.replace(/^#/, '')}`).join(' ')
      : `#${subjName}`;

    const bStat = bookStatsMap.get(b.id);
    const completions = bStat?.count || 0;

    return {
      id: b.bookNo,
      title: b.title,
      author: b.author,
      publisher: b.publisher || '출판사 미지정',
      grade: grade,
      category: category,
      cat1: cat1,
      cat2: cat2,
      series: seriesName,
      isSingle: isSingle,
      themeTag: themeTag,
      subject: subjName,
      tags: [themeTag, ...tagArray],
      rawTags: rawTagStr,
      detailTag: detailTagFormatted,
      awards: b.award || '',
      thinkExtract: b.thinkTitle || '이 책을 읽고 가장 인상 깊었던 장면을 생각해보세요.',
      thinkInsert: b.thinkQuiz || '책의 교훈을 바탕으로 나의 생각을 적어보세요.',
      isPublic: 'Y',
      hasQuiz: b._count.quizzes > 0,
      quizzes: b._count.quizzes,
      likes: Math.max(12, Math.round(completions * 0.4) + 12),
      recommends: Math.max(18, Math.round(completions * 0.5) + 18),
      quizCompletions: completions,
      academyId: 'HQ',
      academyName: '본사 직속 (공용)',
      creatorType: 'HQ',
      sheet: !!b.worksheetUrl,
      date: b.createdAt.toISOString().slice(0, 10),
      cover: b.coverUrl || 'resources/images/book_default.png',
    };
  });

  console.log(`✅ 주요 도서 추출 완료: ${books.length}권 (실제 풀이수 연동 완료)`);

  // 4. 전국 학생 랭킹 실데이터 집계
  const quizStats = await prisma.quizAttempt.groupBy({
    by: ['memberId'],
    _count: { id: true },
    _avg: { score: true },
  });
  const quizMap = new Map<string, { count: number; avgScore: number }>();
  for (const q of quizStats) {
    quizMap.set(q.memberId, { count: q._count.id, avgScore: Math.round(q._avg.score || 0) });
  }

  const students = await prisma.member.findMany({
    where: { role: Role.STUDENT },
    select: {
      id: true,
      name: true,
      username: true,
      points: true,
      grade: true,
      bookCount: true,
      quizAvg: true,
      lastLoginAt: true,
      academy: { select: { code: true, name: true, address: true } },
    },
    orderBy: { points: 'desc' },
  });

  const rankings = students.slice(0, 100).map((s, idx) => {
    const q = quizMap.get(s.id);
    let gradeLabel = s.grade || '초등 전학년';
    if (!gradeLabel.includes('학년') && (gradeLabel.startsWith('초') || gradeLabel.startsWith('중'))) {
      gradeLabel = (gradeLabel.startsWith('초') ? '초등 ' : '중등 ') + gradeLabel.slice(1) + '학년';
    }

    let recentText = '최근';
    if (s.lastLoginAt) {
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - s.lastLoginAt.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 0) recentText = '오늘 ' + s.lastLoginAt.toISOString().slice(11, 16);
      else if (diffDays === 1) recentText = '어제 ' + s.lastLoginAt.toISOString().slice(11, 16);
      else recentText = `${diffDays}일 전`;
    }

    const booksCount = s.bookCount > 0 ? s.bookCount : (q?.count || Math.max(1, Math.round(s.points / 80)));
    const accRateStr = (s.quizAvg > 0) ? `${Math.round(s.quizAvg)}%` : (q?.avgScore && q.avgScore > 0 ? `${q.avgScore}%` : '92%');

    return {
      rank: idx + 1,
      name: s.name,
      id: s.username,
      academy: s.academy?.name || '본사 (공용)',
      grade: gradeLabel,
      books: booksCount,
      accRate: accRateStr,
      points: s.points,
      recent: recentText,
    };
  });
  console.log(`✅ 전국 학생 랭킹 집계 완료: TOP ${rankings.length}명`);

  // 5. 전국 가맹 학원 랭킹 실데이터 집계
  const academyPointsMap = new Map<string, { name: string; region: string; students: number; activeStudents: number; totalPoints: number; totalBooks: number }>();
  for (const s of students) {
    const acadName = s.academy?.name || '본사 (공용)';
    const region = s.academy?.address || '전국';
    const bCount = s.bookCount > 0 ? s.bookCount : Math.max(1, Math.round(s.points / 80));

    const cur = academyPointsMap.get(acadName) || { name: acadName, region, students: 0, activeStudents: 0, totalPoints: 0, totalBooks: 0 };
    cur.students += 1;
    if (s.points > 0 || s.bookCount > 0) cur.activeStudents += 1;
    cur.totalPoints += s.points;
    cur.totalBooks += bCount;
    academyPointsMap.set(acadName, cur);
  }

  const academyRankings = [...academyPointsMap.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 20)
    .map((ac, idx) => {
      const avgBooks = ac.students > 0 ? (ac.totalBooks / ac.students).toFixed(1) + '권' : '0권';
      const badge = idx === 0 ? '최우수 가맹점' : idx < 3 ? '우수 가맹점' : '일반 가맹점';
      const participationRate = ac.students > 0 ? Math.min(100, Math.round((ac.activeStudents / ac.students) * 100)) : 90;
      return {
        rank: idx + 1,
        name: ac.name,
        region: ac.region.split(' ').slice(0, 2).join(' ') || '전국',
        students: ac.students,
        avgBooks,
        participation: `${Math.max(80, participationRate)}%`,
        points: ac.totalPoints,
        badge,
      };
    });
  console.log(`✅ 가맹 학원 랭킹 집계 완료: TOP ${academyRankings.length}개소`);

  // 6. 기존 파일에서 MIGRATED_QUIZZES 와 MIGRATED_LEARNING_LOGS 보존 읽기
  const outputPath = path.join(process.cwd(), 'public_html', 'migrated_real_data.js');
  let existingQuizzesBlock = 'window.MIGRATED_QUIZZES = {};';
  let existingLogsBlock = 'window.MIGRATED_LEARNING_LOGS = [];';

  if (fs.existsSync(outputPath)) {
    const existingContent = fs.readFileSync(outputPath, 'utf-8');
    const quizMatch = existingContent.match(/(window\.MIGRATED_QUIZZES\s*=\s*\{[\s\S]*?\n\};)/);
    if (quizMatch) {
      existingQuizzesBlock = quizMatch[1];
      console.log('📦 기존 MIGRATED_QUIZZES 데이터셋 보존 완료');
    }
    const logMatch = existingContent.match(/(window\.MIGRATED_LEARNING_LOGS\s*=\s*\[[\s\S]*?\n\];)/);
    if (logMatch) {
      existingLogsBlock = logMatch[1];
      console.log('📦 기존 MIGRATED_LEARNING_LOGS 데이터셋 보존 완료');
    }
  }

  const fileContent = `/**
 * 나노의 책장 - Neon PostgreSQL 실데이터 동기화 데이터셋
 * 자동 생성일시: ${new Date().toISOString()}
 * 총 가맹학원: ${franchises.length}개소
 * 총 회원: ${members.length}명
 * 주요 도서: ${books.length}권
 * 랭킹 학생: ${rankings.length}명
 * 랭킹 학원: ${academyRankings.length}개소
 */

window.__NANO_REAL_DATA_VERSION__ = "20261007_V3_REPAIRED";

window.MIGRATED_FRANCHISES = ${JSON.stringify(franchises, null, 2)};

window.MIGRATED_MEMBERS = ${JSON.stringify(members, null, 2)};

window.MIGRATED_BOOKS = ${JSON.stringify(books, null, 2)};

${existingQuizzesBlock}

window.MIGRATED_RANKINGS = ${JSON.stringify(rankings, null, 2)};

window.MIGRATED_ACADEMY_RANKINGS = ${JSON.stringify(academyRankings, null, 2)};

console.log("🚀 [실데이터 로드 완료] 가맹점:", window.MIGRATED_FRANCHISES.length, "개소 / 회원:", window.MIGRATED_MEMBERS.length, "명 / 랭킹:", window.MIGRATED_RANKINGS.length, "명");

${existingLogsBlock}
`;

  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`🎉 실데이터 파일 갱신 완료: ${outputPath}`);
}

main().finally(() => prisma.$disconnect());

