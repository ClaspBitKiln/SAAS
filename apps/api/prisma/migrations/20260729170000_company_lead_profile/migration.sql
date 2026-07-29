ALTER TABLE "companies"
  ADD COLUMN "city" VARCHAR(120),
  ADD COLUMN "industry" VARCHAR(160),
  ADD COLUMN "leadPriority" VARCHAR(1),
  ADD COLUMN "potentialNeed" TEXT,
  ADD COLUMN "managerComment" TEXT,
  ADD COLUMN "sourceUrl" VARCHAR(2048),
  ADD COLUMN "sourceName" VARCHAR(255),
  ADD COLUMN "verifiedAt" TIMESTAMP(3);

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_leadPriority_check"
  CHECK ("leadPriority" IS NULL OR "leadPriority" IN ('A', 'B', 'C'));
