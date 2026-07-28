ALTER TYPE "RequestStatus" ADD VALUE IF NOT EXISTS 'QUOTED';

ALTER TABLE "requests"
  ADD COLUMN "currency" VARCHAR(3) NOT NULL DEFAULT 'RUB',
  ADD COLUMN "sellerName" VARCHAR(255),
  ADD COLUMN "deliveryTerms" VARCHAR(500),
  ADD COLUMN "logisticsCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "otherCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN "proposalNumber" VARCHAR(64),
  ADD COLUMN "proposalIssuedAt" TIMESTAMP(3),
  ADD COLUMN "proposalValidityDays" INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN "followUpAt" TIMESTAMP(3);

ALTER TABLE "request_lines"
  ADD COLUMN "purchaseAmount" DECIMAL(15,2),
  ADD COLUMN "saleAmount" DECIMAL(15,2);

CREATE INDEX "requests_organizationId_status_followUpAt_idx"
  ON "requests"("organizationId", "status", "followUpAt");
