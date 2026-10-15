// 연결된 Vercel 프로젝트의 환경에서만 운영 스키마와 기존 계정 저장 형식을 전환합니다.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { randomBytes, scryptSync } = require('node:crypto');
const root = path.resolve(__dirname, '..');
async function prepare(client) {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('Prisma 생성 완료. 운영 환경이 아니므로 DB 변경은 실행하지 않습니다.');
    return;
  }
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL || (process.env.PORTAL_AUTH_SECRET || '').length < 32) throw new Error('MISSING_PORTAL_CONFIGURATION');
  const { PrismaClient } = require('@prisma/client');
  const db = client || new PrismaClient({ datasources: { db: { url: process.env.DIRECT_URL } }, log: [] });
  try {
    const ddl = fs.readFileSync(path.join(root, 'prisma/portal-upgrade.sql'), 'utf8').split(';').map(s => s.trim()).filter(Boolean);
    await db.$transaction(async tx => {
      // 동시 빌드의 테이블 생성 경쟁을 막습니다. 기존 테이블이나 데이터는 삭제하지 않습니다.
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(18521015)`;
      for (const statement of ddl) await tx.$executeRawUnsafe(statement);
    }, { timeout: 30000 });
    const members = await db.member.findMany({ where: { password: { not: null } }, select: { id: true, password: true } });
    let migrated = 0;
    for (let offset = 0; offset < members.length; offset += 50) {
      const changes = [];
      for (const member of members.slice(offset, offset + 50)) {
        const password = member.password || '';
        if (!password || password.startsWith('scrypt:') || /^\$2[aby]\$|^[a-f0-9]{32,128}$/i.test(password)) continue;
        const salt = randomBytes(16).toString('hex');
        const hash = 'scrypt:' + salt + ':' + scryptSync(password, salt, 64).toString('hex');
        // 빌드 도중 관리자가 바꾼 비밀번호는 덮어쓰지 않습니다.
        changes.push(db.member.updateMany({ where: { id: member.id, password }, data: { password: hash } }));
      }
      if (changes.length) migrated += (await db.$transaction(changes)).reduce((sum, r) => sum + r.count, 0);
    }
    const masterCount = await db.member.count({ where: { role: 'MASTER', status: 'APPROVED', password: { startsWith: 'scrypt:' }, academy: { status: 'ACTIVE', deletedAt: null } } });
    if (!masterCount) throw new Error('NO_ACTIVE_MASTER_ACCOUNT');
    console.log('운영 준비 완료: 추가 테이블 확인, 기존 비밀번호 해시 전환 ' + migrated + '건, 본사 계정 확인.');
  } finally { await db.$disconnect(); }
}
if (require.main === module) {
  process.env.DIRECT_URL ||= process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
  execFileSync(process.execPath, [path.join(root, 'node_modules/prisma/build/index.js'), 'generate'], { cwd: root, env: process.env, stdio: 'inherit' });
  prepare().catch(error => { console.error('운영 준비 실패:', error.code || error.name, ['MISSING_PORTAL_CONFIGURATION','NO_ACTIVE_MASTER_ACCOUNT'].includes(error.message) ? error.message : 'DB 연결 및 빌드 설정 확인 필요'); process.exitCode = 1; });
}
module.exports = { prepare };
