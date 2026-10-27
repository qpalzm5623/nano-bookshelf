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
