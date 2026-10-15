// 관리자가 명시적으로 실행할 때만 지정한 한 계정의 서버 비밀번호를 설정합니다.
// 비밀번호는 명령 인자나 로그 대신 환경변수로 받아 화면에 출력하지 않습니다.
import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/portal-auth';
async function main() {
  const username = process.env.PORTAL_SETUP_USERNAME;
  const password = process.env.PORTAL_SETUP_PASSWORD;
  if (!username || !password || password.length < 12 || password.length > 128) throw new Error('PORTAL_SETUP_USERNAME과 12~128자 PORTAL_SETUP_PASSWORD가 필요합니다.');
  await prisma.member.update({ where: { username }, data: { password: hashPassword(password) } });
  console.log('지정 계정의 서버 비밀번호를 설정했습니다.');
}
main().catch(() => { console.error('계정 비밀번호 설정에 실패했습니다. 계정과 환경변수를 확인해 주세요.'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
