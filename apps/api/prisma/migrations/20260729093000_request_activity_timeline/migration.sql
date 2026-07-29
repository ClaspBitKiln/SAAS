ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "proposalDownloadedAt" TIMESTAMP(3);
