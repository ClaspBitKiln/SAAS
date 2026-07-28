DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestSource') THEN
    CREATE TYPE "RequestSource" AS ENUM ('MANUAL', 'FILE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestStatus') THEN
    CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'SEARCHED');
  END IF;
END
$$;

ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'QUOTED';

CREATE TABLE IF NOT EXISTS "requests" (
  "id" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "contactId" UUID,
  "title" VARCHAR(255),
  "notes" VARCHAR(2000),
  "source" "RequestSource" NOT NULL DEFAULT 'MANUAL',
  "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
  "searchResult" JSONB,
  "currency" VARCHAR(3) NOT NULL DEFAULT 'RUB',
  "sellerName" VARCHAR(255),
  "deliveryTerms" VARCHAR(500),
  "logisticsCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "otherCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "proposalNumber" VARCHAR(64),
  "proposalIssuedAt" TIMESTAMP(3),
  "proposalValidityDays" INTEGER NOT NULL DEFAULT 5,
  "followUpAt" TIMESTAMP(3),
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "request_lines" (
  "id" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "gost" VARCHAR(64),
  "steelGrade" VARCHAR(64),
  "productType" VARCHAR(128),
  "dimensions" VARCHAR(128),
  "length" VARCHAR(64),
  "thickness" VARCHAR(64),
  "coating" VARCHAR(64),
  "quantity" VARCHAR(32),
  "unit" VARCHAR(16),
  "rawLine" VARCHAR(500),
  "purchaseAmount" DECIMAL(15,2),
  "saleAmount" DECIMAL(15,2),
  CONSTRAINT "request_lines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "request_lines_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "requests"
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) NOT NULL DEFAULT 'RUB',
  ADD COLUMN IF NOT EXISTS "sellerName" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "deliveryTerms" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "logisticsCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "otherCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "proposalNumber" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "proposalIssuedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "proposalValidityDays" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "followUpAt" TIMESTAMP(3);

ALTER TABLE "request_lines"
  ADD COLUMN IF NOT EXISTS "purchaseAmount" DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS "saleAmount" DECIMAL(15,2);

CREATE INDEX IF NOT EXISTS "requests_tenantId_idx" ON "requests"("tenantId");
CREATE INDEX IF NOT EXISTS "requests_organizationId_idx" ON "requests"("organizationId");
CREATE INDEX IF NOT EXISTS "requests_contactId_idx" ON "requests"("contactId");
CREATE INDEX IF NOT EXISTS "requests_organizationId_status_followUpAt_idx"
  ON "requests"("organizationId", "status", "followUpAt");
CREATE INDEX IF NOT EXISTS "request_lines_requestId_idx" ON "request_lines"("requestId");
