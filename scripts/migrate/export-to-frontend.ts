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
      lastLogin: m.lastLoginAt ? m.lastLoginAt.toISOString().slice(0, 16).replace('T', ' ') : '-',
      createdAt: m.createdAt.toISOString().slice(0, 10),
      status: m.status === 'APPROVED' ? 'APPROVED' : m.status === 'SUSPENDED' ? 'WITHDRAWN' : 'PENDING',
    };
  });

  console.log(`✅ 통합 회원 추출 완료: ${members.length}명`);

  // 3. 도서 목록 추출 (상위 200권 또는 주요 도서)
  const rawBooks = await prisma.book.findMany({
    take: 300,
    orderBy: { bookNo: 'asc' },
    include: {
      _count: {
        select: { quizzes: true },
      },
    },
  });

  const books = rawBooks.map((b) => ({
    id: b.bookNo,
    title: b.title,
    author: b.author,
    publisher: b.publisher || '출판사 미지정',
    grade: b.grade || '초등 전학년',
    category: b.category === 'K' ? '국내도서' : '외서/번역',
    cat1: b.category === 'K' ? '국내도서' : '외서',
    cat2: b.subCategory || '문학',
    series: b.series || '단권',
    isSingle: true,
    tags: [b.category === 'K' ? '국내' : '해외', b.level || '기본'],
    detailTag: `#${b.author} #${b.category}`,
    awards: b.award || '',
    thinkExtract: b.thinkTitle || '이 책을 읽고 가장 인상 깊었던 장면을 생각해보세요.',
    thinkInsert: b.thinkQuiz || '책의 교훈을 바탕으로 나의 생각을 적어보세요.',
    isPublic: 'Y',
    hasQuiz: b._count.quizzes > 0,
    quizzes: b._count.quizzes,
    likes: Math.floor(Math.random() * 40) + 10,
    recommends: Math.floor(Math.random() * 50) + 20,
    quizCompletions: Math.floor(Math.random() * 100) + 30,
    academyId: 'HQ',
    academyName: '본사 직속 (공용)',
    creatorType: 'HQ',
    sheet: !!b.worksheetUrl,
    date: b.createdAt.toISOString().slice(0, 10),
    cover: b.coverUrl || 'resources/images/book_default.png',
  }));

  console.log(`✅ 주요 도서 추출 완료: ${books.length}권`);

  // 4. JS 파일로 저장 (public_html/migrated_real_data.js)
  const fileContent = `/**
 * 나노의 책장 - Neon PostgreSQL 실데이터 동기화 데이터셋
 * 자동 생성일시: ${new Date().toISOString()}
 * 총 가맹학원: ${franchises.length}개소
 * 총 회원: ${members.length}명
 * 주요 도서: ${books.length}권
 */

window.__NANO_REAL_DATA_VERSION__ = "20261007_V1";

window.MIGRATED_FRANCHISES = ${JSON.stringify(franchises, null, 2)};

window.MIGRATED_MEMBERS = ${JSON.stringify(members, null, 2)};

window.MIGRATED_BOOKS = ${JSON.stringify(books, null, 2)};

console.log("🚀 [실데이터 로드 완료] 가맹점:", window.MIGRATED_FRANCHISES.length, "개소 / 회원:", window.MIGRATED_MEMBERS.length, "명");
`;

  const outputPath = path.join(process.cwd(), 'public_html', 'migrated_real_data.js');
  fs.writeFileSync(outputPath, fileContent, 'utf-8');
  console.log(`🎉 실데이터 파일 생성 완료: ${outputPath}`);
}

main().finally(() => prisma.$disconnect());
