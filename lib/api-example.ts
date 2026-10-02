// ==============================================================
// 나노의책장 - Prisma DB CRUD 연동 예시 모듈 (lib/api-example.ts)
// ==============================================================
// Next.js Route Handlers(API) 또는 서버 컴포넌트에서 그대로 import하여 사용합니다.
// ==============================================================

import { prisma } from './prisma';
import { PlanTier, Role, AcademyStatus } from '@prisma/client';

// 1. 가맹 학원 목록 조회 (원생 수 집계 포함)
export async function getAcademies() {
  return await prisma.academy.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: {
          members: {
            where: { role: Role.STUDENT }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// 2. 신규 가맹 학원 등록
export async function createAcademy(params: {
  code: string;
  name: string;
  bizNo?: string;
  directorName: string;
  phone: string;
  email?: string;
  address?: string;
  plan: PlanTier;
  maxStudents: number;
  monthlyFee: number;
  startDate: Date;
  endDate: Date;
  memo?: string;
}) {
  return await prisma.academy.create({
    data: {
      code: params.code,
      name: params.name,
      bizNo: params.bizNo,
      directorName: params.directorName,
      phone: params.phone,
      email: params.email,
      address: params.address,
      plan: params.plan,
      maxStudents: params.maxStudents,
      monthlyFee: params.monthlyFee,
      startDate: params.startDate,
      endDate: params.endDate,
      memo: params.memo,
      status: AcademyStatus.ACTIVE
    }
  });
}

// 3. 가맹 학원 7일 임시보존 삭제 (소프트 딜리트)
export async function softDeleteAcademy(academyId: string) {
  return await prisma.academy.update({
    where: { id: academyId },
    data: { deletedAt: new Date() }
  });
}

// 4. 가맹 학원 복구
export async function restoreAcademy(academyId: string) {
  return await prisma.academy.update({
    where: { id: academyId },
    data: { deletedAt: null }
  });
}

// 5. 통합 회원 목록 조회 (소속 학원 정보 포함)
export async function getMembers(filter?: { academyId?: string; role?: Role }) {
  return await prisma.member.findMany({
    where: {
      ...(filter?.academyId ? { academyId: filter.academyId } : {}),
      ...(filter?.role ? { role: filter.role } : {})
    },
    include: {
      academy: {
        select: { name: true, code: true }
      },
      classGroup: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
