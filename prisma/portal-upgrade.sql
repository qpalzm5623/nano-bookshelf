-- 기존 데이터·테이블을 변경하거나 삭제하지 않는 추가 테이블입니다.
CREATE TABLE IF NOT EXISTS "portal_settings" (
  "key" TEXT PRIMARY KEY, "scope" TEXT NOT NULL, "value" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1, "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "portal_settings_scope_idx" ON "portal_settings"("scope");
CREATE TABLE IF NOT EXISTS "portal_files" (
  "id" TEXT PRIMARY KEY, "academyId" TEXT NOT NULL, "memberId" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL, "name" TEXT NOT NULL, "mime" TEXT NOT NULL,
  "data" BYTEA NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "portal_files_attemptId_idx" ON "portal_files"("attemptId");
CREATE INDEX IF NOT EXISTS "portal_files_academyId_idx" ON "portal_files"("academyId");

-- 학생 화면의 퀴즈·학습·포인트 조회를 위한 복합 인덱스입니다.
CREATE INDEX IF NOT EXISTS "book_quizzes_bookId_questionNo_idx"
  ON "book_quizzes"("bookId", "questionNo");
CREATE INDEX IF NOT EXISTS "quiz_attempts_memberId_bookId_completedAt_idx"
  ON "quiz_attempts"("memberId", "bookId", "completedAt");
CREATE INDEX IF NOT EXISTS "point_histories_memberId_createdAt_idx"
  ON "point_histories"("memberId", "createdAt");
CREATE INDEX IF NOT EXISTS "book_assignments_memberId_academyId_isCompleted_idx"
  ON "book_assignments"("memberId", "academyId", "isCompleted");
CREATE INDEX IF NOT EXISTS "book_quizzes_bookId_legacyQuizSeq_idx"
  ON "book_quizzes"("bookId", "legacyQuizSeq");
CREATE INDEX IF NOT EXISTS "quiz_attempts_bookId_score_idx"
  ON "quiz_attempts"("bookId", "score");

-- 카카오 알림톡 지갑 잔액 및 결제/발송 확장 컬럼 (멱등 적용)
ALTER TABLE "academies" ADD COLUMN IF NOT EXISTS "kakaoBalance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "productCode" TEXT,
  ADD COLUMN IF NOT EXISTS "productName" TEXT,
  ADD COLUMN IF NOT EXISTS "supplyAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "vatAmount" INTEGER,
  ADD COLUMN IF NOT EXISTS "serviceStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "serviceEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "taxInvoiceIssued" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "memo" TEXT,
  ADD COLUMN IF NOT EXISTS "revision" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "aligo_dispatch_logs"
  ADD COLUMN IF NOT EXISTS "memberId" TEXT,
  ADD COLUMN IF NOT EXISTS "className" TEXT,
  ADD COLUMN IF NOT EXISTS "studentName" TEXT,
  ADD COLUMN IF NOT EXISTS "providerId" TEXT,
  ADD COLUMN IF NOT EXISTS "retryOf" TEXT,
  ADD COLUMN IF NOT EXISTS "payload" JSONB,
  ADD COLUMN IF NOT EXISTS "debitAmount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "resultCode" TEXT,
  ADD COLUMN IF NOT EXISTS "resultMessage" TEXT,
  ADD COLUMN IF NOT EXISTS "fallbackId" TEXT,
  ADD COLUMN IF NOT EXISTS "checkedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "aligo_dispatch_logs_retryOf_key" ON "aligo_dispatch_logs"("retryOf");
CREATE INDEX IF NOT EXISTS "aligo_dispatch_logs_status_checkedAt_idx" ON "aligo_dispatch_logs"("status", "checkedAt");
CREATE TABLE IF NOT EXISTS "kakao_ledger" (
  "id" TEXT PRIMARY KEY,
  "academyId" TEXT NOT NULL REFERENCES "academies"("id"),
  "amount" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "referenceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "kakao_ledger_academyId_createdAt_idx" ON "kakao_ledger"("academyId", "createdAt");
