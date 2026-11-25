import { authorizeBrand, assertBrandAcademy, guardRestrictedRequest } from './portal-brand';
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
  const needSessionCheck = Boolean(user && user.role !== 'MASTER' && session && session.sid);
  const sessionKey = 'session:' + user.id;
  const academyMetaKey = 'academy_meta:' + user.academyId;
  const memberPolicyKey = 'member_policy:' + user.id;
  let prefetchedBrand: { academyMeta?: any; hasAcademyMeta?: boolean; memberPolicy?: any; hasMemberPolicy?: boolean } | undefined;

  // 피크타임 DB 왕복을 줄이기 위해 session/academy_meta/member_policy 3개 설정을 1회 findMany 배치 조회로 통합합니다.
  if (typeof prisma.portalSetting?.findMany === 'function') {
    const keys = [academyMetaKey, memberPolicyKey];
    if (needSessionCheck) keys.push(sessionKey);
    try {
      const rows = await prisma.portalSetting.findMany({
        where: { key: { in: keys } },
        select: { key: true, value: true },
      });
      const byKey = new Map<string, any>();
      for (const row of rows || []) byKey.set(row.key, row.value);
      if (needSessionCheck) {
        const active = byKey.get(sessionKey) as any;
        if (active?.sessionId && active.sessionId !== session.sid) {
          throw new PortalError(401, '다른 기기에서 로그인하여 현재 접속이 종료되었습니다.');
        }
      }
      prefetchedBrand = {
        academyMeta: byKey.get(academyMetaKey),
        hasAcademyMeta: true,
        memberPolicy: byKey.get(memberPolicyKey),
        hasMemberPolicy: true,
      };
    } catch (e) {
      if (e instanceof PortalError) throw e;
    }
  } else if (needSessionCheck && prisma.portalSetting?.findUnique) {
    try {
      const activeSetting = await prisma.portalSetting.findUnique({ where: { key: sessionKey } });
      if (activeSetting && activeSetting.value) {
        const active = activeSetting.value as any;
        if (active.sessionId && active.sessionId !== session.sid) {
          throw new PortalError(401, '다른 기기에서 로그인하여 현재 접속이 종료되었습니다.');
        }
      }
    } catch (e) {
      if (e instanceof PortalError) throw e;
    }
  }
  const brandedUser = await authorizeBrand(req, user, prefetchedBrand);
  guardRestrictedRequest(req, brandedUser);
  return brandedUser;
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
  if (error instanceof PortalError || error.brandAccess === true) return res.status(error.status).json({ error: error.message });
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
  await assertBrandAcademy(user, academy.id);
  return academy.id;
}
