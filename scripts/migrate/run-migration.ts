// ==============================================================
// 나노의책장 - 데이터 이관 실행 엔트리포인트 (안전 오케스트레이터 위임)
// ==============================================================
// 과거 단일 스크립트 실행 시 발생했던 평문 비밀번호 적재, 회원/학원 ID 재생성으로 인한
// 설정 초기화, 원장 누락, 찜/추천 및 단권 학습리포트 누락 이슈를 원천 차단하기 위해
// 항상 통합 안전 마이그레이션(full-safe-migration.ts)을 통해 실행됩니다.
// ==============================================================

import { prisma } from '../../lib/prisma';
import { runFullSafeMigration } from './full-safe-migration';

runFullSafeMigration()
  .catch((e) => {
    console.error('❌ 이관 중 오류 발생:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
