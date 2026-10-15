import { prisma } from './prisma';
import { passwordVersion, readSession } from './portal-auth';
export class PortalError extends Error { constructor(public status: number, message: string) { super(message); } }
export function need(condition: any, message: string, status = 400): asserts condition { if (!condition) throw new PortalError(status, message); }
export async function authenticate(req: any) {
  need(['GET', 'POST'].includes(req.method), '지원하지 않는 요청입니다.', 405);
  if (req.method === 'POST') {
    let origin = ''; try { origin = new URL(req.headers.origin).host; } catch {}
    need(origin === req.headers.host && String(req.headers['content-type']).startsWith('application/json'), '요청 출처를 확인할 수 없습니다.', 403);
  }
  const token = String(req.headers.cookie || '').split(';').map((s: string) => s.trim()).find((s: string) => s.startsWith('nano_portal='))?.slice(12) || '';
  const session = readSession(token);
  const user = session && await prisma.member.findUnique({ where: { id: session.sub }, include: { academy: true, classGroup: true } });
  need(user && session && user.status === 'APPROVED' && user.academy.status === 'ACTIVE' && !user.academy.deletedAt && session.version === passwordVersion(user.password || ''), '다시 로그인해 주세요.', 401);
  return user;
}
export function staff(user: any) { need(['MASTER','DIRECTOR','TEACHER'].includes(user.role), '관리자 권한이 필요합니다.', 403); }
export function master(user: any) { need(user.role === 'MASTER', '본사 관리자 권한이 필요합니다.', 403); }
export function text(value: any, label: string, max = 200, required = false) {
  need(typeof value === 'string' || value == null, label + ' 형식을 확인해 주세요.');
  const result = String(value || '').trim();
  need(result.length <= max && (!required || !!result) && !/[<>]/.test(result), label + ' 내용을 확인해 주세요.');
  return result;
}
export function failure(res: any, error: any) {
  if (error instanceof PortalError) return res.status(error.status).json({ error: error.message });
  if (error.code === 'P2002') return res.status(409).json({ error: '이미 등록된 아이디 또는 코드입니다.' });
  if (error.code === 'P2025') return res.status(404).json({ error: '항목이 삭제되거나 변경되었습니다. 새로고침해 주세요.' });
  if (error.code === 'P2021') return res.status(503).json({ error: '추가 서버 테이블 설정이 필요합니다. 관리자에게 문의해 주세요.' });
  console.error('Portal operation failed', error.code || error.name);
  return res.status(500).json({ error: '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
}
export async function academyScope(user: any, code?: string) {
  if (!code || code === user.academy.code) return user.academyId;
  master(user);
  const academy = await prisma.academy.findUnique({ where: { code } });
  need(academy && !academy.deletedAt, '학원을 찾을 수 없습니다.', 404);
  return academy.id;
}
