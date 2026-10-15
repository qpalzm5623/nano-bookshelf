// ==============================================================
// 나노의책장 - Prisma Client 인스턴스 (Vercel Serverless 최적화)
// ==============================================================
import { PrismaClient } from '@prisma/client';

// Vercel Neon 통합이 제공하는 직접 연결 변수를 기존 설정 이름과 호환합니다.
process.env.DIRECT_URL ||= process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// BigInt JSON 직렬화 지원 (Next.js / Express res.json 크래시 방지)
if (typeof BigInt !== 'undefined' && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
