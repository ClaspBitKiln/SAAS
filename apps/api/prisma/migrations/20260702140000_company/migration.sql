-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "inn" VARCHAR(12),
    "website" VARCHAR(2048),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "status" "CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_tenantId_idx" ON "companies"("tenantId");

-- CreateIndex
CREATE INDEX "companies_organizationId_idx" ON "companies"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_organizationId_inn_key" ON "companies"("organizationId", "inn");
