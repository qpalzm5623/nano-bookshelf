// ==============================================================
// 나노의책장 - nanobook 독립 데이터 백업 스크립트 (scripts/backup.ts)
// ==============================================================
// 실행: npm run db:backup
// 효과: touch 프로젝트와 무관하게 '나노의책장' 데이터만 JSON 파일로 안전 백업
// ==============================================================

import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

async function backup() {
  console.log('📦 나노의책장(nanobook) 데이터 백업 시작...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const data = {
    backupDate: new Date().toISOString(),
    schema: 'nanobook',
    academies: await prisma.academy.findMany(),
    classes: await prisma.classGroup.findMany(),
    members: await prisma.member.findMany(),
    payments: await prisma.payment.findMany(),
    books: await prisma.book.findMany(),
    quizzes: await prisma.bookQuiz.findMany(),
    quizAttempts: await prisma.quizAttempt.findMany(),
    readingReports: await prisma.readingReport.findMany(),
    banners: await prisma.mainBanner.findMany(),
    themes: await prisma.themeCategory.findMany(),
    notices: await prisma.notice.findMany(),
    dispatchLogs: await prisma.aligoDispatchLog.findMany(),
  };

  const backupFilePath = path.join(backupDir, `nanobook_backup_${timestamp}.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`✅ 백업 성공! 파일 위치:\n   ${backupFilePath}`);
  console.log(`📊 백업 통계: 가맹 학원 ${data.academies.length}개소, 통합 회원 ${data.members.length}명, 배너 ${data.banners.length}개`);
}

backup()
  .catch((e) => {
    console.error('❌ 백업 실패:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
