import { loadTables } from './legacy-dump';
import { PrismaClient, Role, PlanTier, MemberStatus } from '@prisma/client';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'nano123!';

function mapPlanTier(plan: any): PlanTier {
  const p = String(plan ?? '').trim();
  if (p === '10' || p.toLowerCase() === 'basic') return PlanTier.BASIC;
  if (p === '30' || p.toLowerCase() === 'standard') return PlanTier.STANDARD;
  if (p === '50' || p.toLowerCase() === 'premium') return PlanTier.PREMIUM;
  if (p === '100' || p.toLowerCase() === 'royal') return PlanTier.ROYAL;
  if (p === '150' || p === '200' || p.toLowerCase() === 'vip') return PlanTier.VIP;
  return PlanTier.STANDARD;
}

function parseSafeDate(val: any, fallback: Date | null): Date | null {
  if (!val) return fallback;
  const s = String(val).trim();
  if (!s || s.startsWith('0000') || s.startsWith('00-00')) return fallback;
  const d = new Date(s);
  return isNaN(d.getTime()) ? fallback : d;
}

async function main() {
  console.log('🔧 [나노의책장] 원장 부재 학원 62개소 원장 계정 복구 및 정합성 보정 시작...\n');

  const T = await loadTables(['tb_user']);
  const allLegacyDirectors = T.tb_user.filter((u) => u.user_type === 'director');

  // group_name -> 원장 데이터 매핑 (가장 최근 또는 정보가 풍부한 것 우선)
  const legacyDirMap = new Map<string, any>();
  for (const d of allLegacyDirectors) {
    const grp = String(d.group_name ?? '').trim();
    if (grp) {
      legacyDirMap.set(grp, d);
    }
  }

  const allAcademies = await prisma.academy.findMany({
    include: {
      members: { select: { id: true, role: true, username: true } },
    },
    orderBy: { code: 'asc' },
  });

  let restoredFromLegacy = 0;
  let createdForOthers = 0;

  for (const ac of allAcademies) {
    if (ac.code === 'ACAD-HQ') continue;

    const hasDirector = ac.members.some((m) => m.role === Role.DIRECTOR);
    if (hasDirector) continue;

    const legD = legacyDirMap.get(ac.name);
    if (legD) {
      // 1. 레거시 원장 데이터 기반 복구
      const username = String(legD.user_id).trim();
      const name = String(legD.user_name ?? `${ac.name} 원장`).trim();
      const phone = String(legD.cell_no ?? '010-0000-0000');
      const email = legD.email ? String(legD.email) : null;
      const plan = mapPlanTier(legD.pricing_plan);
      const maxStudents = Number(legD.use_count) > 0 ? Number(legD.use_count) : 50;
      const monthlyFee = Number(legD.pricing_price) > 0 ? Number(legD.pricing_price) : 330000;
      const startDate = parseSafeDate(legD.start_date, new Date('2025-01-01'))!;
      const endDate = parseSafeDate(legD.end_date ?? legD.service_end_date, new Date('2027-12-31'))!;
      const legacySeq = Number(legD.user_seq);

      // Academy 정보 갱신 (legacySeq 중복 방지 체크)
      const existingAcadWithSeq = await prisma.academy.findUnique({ where: { legacySeq } });
      const acadUpdateData: any = {
        directorName: name,
        phone,
        email,
        plan,
        maxStudents,
        monthlyFee,
        startDate,
        endDate,
      };
      if (!existingAcadWithSeq || existingAcadWithSeq.id === ac.id) {
        acadUpdateData.legacySeq = legacySeq;
      } else {
        console.log(`⚠️ legacySeq ${legacySeq}가 이미 다른 학원(${existingAcadWithSeq.code} "${existingAcadWithSeq.name}")에 할당됨. ac: ${ac.code}`);
      }

      await prisma.academy.update({
        where: { id: ac.id },
        data: acadUpdateData,
      });

      // 이미 username 또는 legacySeq가 존재하는지 확인
      const existingMemberByUsername = await prisma.member.findUnique({ where: { username } });
      const existingMemberBySeq = await prisma.member.findUnique({ where: { legacySeq } });

      if (existingMemberByUsername) {
        // 기존 계정을 원장으로 승격 및 소속 학원 동기화
        await prisma.member.update({
          where: { id: existingMemberByUsername.id },
          data: {
            academyId: ac.id,
            role: Role.DIRECTOR,
            status: MemberStatus.APPROVED,
          },
        });
      } else if (existingMemberBySeq) {
        // legacySeq가 일치하는 회원을 원장으로 승격
        await prisma.member.update({
          where: { id: existingMemberBySeq.id },
          data: {
            academyId: ac.id,
            role: Role.DIRECTOR,
            status: MemberStatus.APPROVED,
          },
        });
      } else {
        // 신규 원장 Member 생성
        await prisma.member.create({
          data: {
            academyId: ac.id,
            role: Role.DIRECTOR,
            name,
            username,
            password: DEFAULT_PASSWORD,
            phone,
            status: MemberStatus.APPROVED,
            legacySeq,
          },
        });
      }
      restoredFromLegacy++;
      console.log(`✅ [복구 완료] ${ac.code} "${ac.name}" -> 원장: ${name} (${username})`);
    } else {
      // 2. 레거시에 원장이 없는 학원 (테스트 등): 표준 관리자 원장 계정 발급
      const safeId = ac.code.toLowerCase().replace(/[^a-z0-9]/g, '');
      const username = `dir_${safeId}`;
      const name = `${ac.name} 원장`;

      const existingMember = await prisma.member.findUnique({ where: { username } });
      if (!existingMember) {
        await prisma.member.create({
          data: {
            academyId: ac.id,
            role: Role.DIRECTOR,
            name,
            username,
            password: DEFAULT_PASSWORD,
            phone: '010-0000-0000',
            status: MemberStatus.APPROVED,
          },
        });
      }
      createdForOthers++;
      console.log(`ℹ️ [계정 발급] ${ac.code} "${ac.name}" -> 기본 원장 생성: ${name} (${username})`);
    }
  }

  console.log(`\n🎉 [완료] 레거시 원장 실데이터 복구: ${restoredFromLegacy}개소, 기본 계정 발급: ${createdForOthers}개소`);
}

main()
  .catch((e) => {
    console.error('❌ 복구 중 오류:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
