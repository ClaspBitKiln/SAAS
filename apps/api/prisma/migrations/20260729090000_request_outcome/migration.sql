DO $$
BEGIN
  CREATE TYPE "RequestOutcome" AS ENUM ('WON', 'LOST', 'NO_RESPONSE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "outcome" "RequestOutcome",
  ADD COLUMN IF NOT EXISTS "outcomeReason" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "outcomeAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "requests_organizationId_outcome_outcomeAt_idx"
  ON "requests"("organizationId", "outcome", "outcomeAt");
