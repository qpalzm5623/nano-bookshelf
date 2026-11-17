import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/portal-auth';

// 환경 파일을 읽지 않습니다. 연결은 실행 환경에서 주입하고 비밀번호는 표준 입력으로 받습니다.
async function run() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL이 설정된 승인된 실행 환경에서 실행해 주세요.');
  let password = '';
  for await (const chunk of process.stdin) password += chunk.toString();
  password = password.trim();
  if (password.length < 6 || password.length > 128) throw new Error('초기 비밀번호(6~128자)를 표준 입력으로 전달해 주세요.');
  const hashed = hashPassword(password);
  password = '';
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(18521016)`;
    const existing = await tx.member.findUnique({ where: { username: 'jdmaster' } });
    if (existing) {
      const policy = await tx.portalSetting.findUnique({ where: { key: 'member_policy:' + existing.id } });
      if ((policy?.value as any)?.kind !== 'JD_MASTER' || existing.role !== 'MASTER') throw new Error('동일한 ID가 이미 사용 중입니다. 기존 계정을 변경하지 않았습니다.');
      console.log('JD 전용 관리자 계정이 이미 존재합니다. 비밀번호는 변경하지 않았습니다.');
      return;
    }
    const academy = await tx.academy.create({ data: {
      code: 'JD-HQ', name: '정답이 있는 독서 본사', directorName: 'JD 운영 관리자', phone: '',
      startDate: new Date(), endDate: new Date('2099-12-31T00:00:00Z'), status: 'ACTIVE', monthlyFee: 0
    } });
    await tx.portalSetting.create({ data: { key: 'academy_meta:' + academy.id, scope: 'academy_meta', value: { brand: 'JD', uiStatus: 'ACTIVE' } } });
    const member = await tx.member.create({ data: { academyId: academy.id, username: 'jdmaster', name: 'JD 운영 관리자', role: 'MASTER', status: 'APPROVED', password: hashed } });
    await tx.portalSetting.create({ data: { key: 'member_policy:' + member.id, scope: 'member_policy', value: { kind: 'JD_MASTER' } } });
    console.log('JD 전용 관리자 계정 생성 완료. JD 도메인에서 로그인할 수 있습니다.');
  });
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
