-- 운영 DB 적용 전 백업 및 검토 필요. 기존 결제/발송은 소급 충전·차감하지 않습니다.
-- 이 파일은 빌드에서 자동 실행되지 않습니다. 새 코드 배포 전에 별도 적용합니다.
-- CRON_SECRET 및 ALIGO_API_KEY, ALIGO_USER_ID 환경변수 설정 후 정기 조회가 동작합니다.
-- 기본 정기 조회: 매일 UTC 00:00 (한국시간 09:00). 발송 내역 화면에서도 조회합니다.
-- 5,500원 결제 = 공급가 5,000원 적립 + VAT 500원. 잔액은 0.1원 정수, 1회 85 차감.
-- 알리고 최종 실패는 24시간 경과 후 조회해 환급합니다. UNKNOWN/미확인 결과는 유지합니다.
BEGIN;
ALTER TABLE academies ADD COLUMN IF NOT EXISTS "kakaoBalance" INTEGER NOT NULL DEFAULT 0 CHECK ("kakaoBalance" >= 0);
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS "productCode" TEXT,
  ADD COLUMN IF NOT EXISTS "productName" TEXT,
  ADD COLUMN IF NOT EXISTS "supplyAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "vatAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "serviceStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "serviceEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "taxInvoiceIssued" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS memo TEXT,
  ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE aligo_dispatch_logs
  ADD COLUMN IF NOT EXISTS "memberId" TEXT,
  ADD COLUMN IF NOT EXISTS "className" TEXT,
  ADD COLUMN IF NOT EXISTS "studentName" TEXT,
  ADD COLUMN IF NOT EXISTS "providerId" TEXT,
  ADD COLUMN IF NOT EXISTS "retryOf" TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS "debitAmount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resultCode" TEXT,
  ADD COLUMN IF NOT EXISTS "resultMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "fallbackId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "aligo_dispatch_logs_retryOf_key" ON aligo_dispatch_logs("retryOf");
CREATE INDEX IF NOT EXISTS "aligo_dispatch_logs_status_checkedAt_idx" ON aligo_dispatch_logs(status, "checkedAt");
CREATE TABLE IF NOT EXISTS kakao_ledger (
  id TEXT PRIMARY KEY,
  "academyId" TEXT NOT NULL REFERENCES academies(id),
  amount INTEGER NOT NULL,
  kind TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "kakao_ledger_academyId_createdAt_idx" ON kakao_ledger("academyId", "createdAt");
COMMIT;
