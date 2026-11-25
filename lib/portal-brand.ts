import { prisma } from './prisma';

export type Brand = 'NANO' | 'JD';
export function brandOf(value: any): Brand { return value?.brand === 'JD' ? 'JD' : 'NANO'; }
export function requestBrand(req: any): Brand {
  return String(req.headers?.host || '').toLowerCase().split(':')[0] === 'jd.nanosbook.co.kr' ? 'JD' : 'NANO';
}
export function restrictedMaster(user: any): boolean { return user?.role === 'MASTER' && user?.brandPolicy === 'JD_MASTER'; }
export function brandError(message: string) { return Object.assign(new Error(message), { status: 403, brandAccess: true }); }
export async function academyBrand(id: string): Promise<Brand> {
  const row = await prisma.portalSetting.findUnique({ where: { key: 'academy_meta:' + id } });
  return brandOf(row?.value);
}
export async function brandAcademyIds(brand: Brand): Promise<string[]> {
  const rows = await prisma.portalSetting.findMany({ where: { scope: 'academy_meta' }, select: { key: true, value: true } });
  return rows.filter(r => brandOf(r.value) === brand).map(r => r.key.replace(/^academy_meta:/, ''));
}
export interface PrefetchedBrandSettings {
  academyMeta?: any;
  hasAcademyMeta?: boolean;
  memberPolicy?: any;
  hasMemberPolicy?: boolean;
}
// 도메인/권한은 클라이언트 입력이 아닌 서버에 저장된 정책으로 결정합니다.
export async function authorizeBrand<T extends { id: string; academyId: string; role: string; username: string }>(
  req: any,
  user: T,
  prefetched?: PrefetchedBrandSettings
) {
  const [brand, policy] = await Promise.all([
    prefetched?.hasAcademyMeta ? Promise.resolve(brandOf(prefetched.academyMeta)) : academyBrand(user.academyId),
    prefetched?.hasMemberPolicy
      ? Promise.resolve({ value: prefetched.memberPolicy })
      : prisma.portalSetting.findUnique({ where: { key: 'member_policy:' + user.id } })
  ]);
  const brandPolicy = (policy?.value as any)?.kind === 'JD_MASTER' || (user.role === 'MASTER' && user.username === 'jdmaster') ? 'JD_MASTER' : '';
  const result = Object.assign(user, { brand, brandPolicy, portalBrand: requestBrand(req) });
  if (restrictedMaster(result) && brand !== 'JD') throw brandError('JD 관리자 소속의 구분을 확인해 주세요.');
  const requiredBrand = restrictedMaster(result) ? 'JD' : brand;
  const host = String(req.headers?.host || '').toLowerCase().split(':')[0];
  if (process.env.NODE_ENV === 'production' && (user.role !== 'MASTER' || restrictedMaster(result)) && !['jd.nanosbook.co.kr', 'nanosbook.co.kr', 'www.nanosbook.co.kr'].includes(host)) throw brandError('등록된 전용 도메인으로 접속해 주세요.');
  if ((user.role !== 'MASTER' || restrictedMaster(result)) && requestBrand(req) !== requiredBrand) {
    throw brandError(requiredBrand === 'JD' ? '정답이 있는 독서 계정은 jd.nanosbook.co.kr에서 로그인해 주세요.' : '나노의 책장 계정은 nanosbook.co.kr에서 로그인해 주세요.');
  }
  return result;
}
export async function assertBrandAcademy(user: any, academyId: string) {
  if (restrictedMaster(user) && await academyBrand(academyId) !== 'JD') throw brandError('정답이 있는 독서 가맹점만 조회할 수 있습니다.');
}
export async function operationInBrand(scope: string, id: string, brand: Brand) {
  const row = await prisma.portalSetting.findUnique({ where: { key: scope + ':' + id } });
  if (brandOf(row?.value) !== brand) throw brandError('다른 브랜드의 운영 항목은 변경할 수 없습니다.');
}

export function guardRestrictedRequest(req: any, user: any) {
  if (!restrictedMaster(user)) return;
  const route = new URL(req.url || '/', 'https://portal.local').pathname.replace(/\/$/, '');
  const action = String(req.query?.action || '');
  const entity = String(req.query?.entity || 'members');
  let permitted = false;
  if (route === '/api/manage') {
    permitted = req.method === 'GET'
      ? ['academies', 'members', 'classes', 'books', 'quizzes', 'owned', 'assignments', 'notices', 'themes', 'banners', 'dispatch', 'portfolios', 'rankings', 'recommendations'].includes(entity)
      : ['books', 'notices', 'banners', 'recommendations', 'summarize_synopsis'].includes(entity);
  } else if (route === '/api/content') permitted = true;
  else if (route === '/api/files') permitted = req.method === 'GET' || req.body?.scope === 'media';
  else if (route === '/api/services') permitted = req.method === 'GET' && action === 'dispatch_stats';
  else if (route === '/api/activity') permitted = req.method === 'GET' && ['rankings', 'themes', 'banners', 'onboarding_interest', 'popular', 'summary', 'characters', 'preferences', 'recommend'].includes(action);
  else if (route === '/api/literacy') permitted = req.method === 'GET';
  if (!permitted) throw brandError('JD 전용 관리자에게 허용되지 않은 기능입니다.');
}


/** DB main_banner + portal_settings(banner_meta) 레코드를 포털 공통 배너 객체로 정규화합니다. */
export function mapBannerRecord(b: any, meta: Record<string, any> = {}) {
  let linkBookIds: string[] = [];
  let hasBooksParam = false;
  let linkSub = '';
  if (typeof b?.linkUrl === 'string' && b.linkUrl.startsWith('#')) {
    try {
      const params = new URLSearchParams(b.linkUrl.slice(1));
      if (params.has('books')) {
        hasBooksParam = true;
        const rawBooks = params.get('books') || '';
        if (rawBooks) linkBookIds = rawBooks.split(',').map(s => s.trim()).filter(Boolean);
      }
      linkSub = params.get('sub') || '';
    } catch {}
  }
  const metaBookIds = Array.isArray(meta.bookIds)
    ? meta.bookIds.map((id: any) => String(id || '').trim()).filter(Boolean)
    : null;
  const bookIds = metaBookIds !== null
    ? ((metaBookIds.length > 0 || !hasBooksParam || linkBookIds.length === 0) ? metaBookIds : linkBookIds)
    : linkBookIds;
  const updatedAt = Math.max(
    b?.updatedAt ? +new Date(b.updatedAt) : 0,
    Number(meta._updatedAt) || 0,
    Number(meta.updatedAt) || 0
  );
  return {
    ...b,
    active: b.isActive ? 'Y' : 'N',
    order: b.orderNo,
    image: b.imageUrl || '',
    imageUrl: b.imageUrl || '',
    link: b.linkUrl || '',
    sub: meta.sub || linkSub || '',
    bookIds,
    clicks: typeof meta.clicks === 'number' ? meta.clicks : 0,
    createdAt: meta.createdAt || '2026-09-01',
    updatedAt,
    type: 'image'
  };
}
