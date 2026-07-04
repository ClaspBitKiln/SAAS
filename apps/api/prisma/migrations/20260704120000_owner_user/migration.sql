-- AlterTable
ALTER TABLE "companies" ADD COLUMN "ownerUserId" UUID;

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN "ownerUserId" UUID;

-- CreateIndex
CREATE INDEX "companies_ownerUserId_idx" ON "companies"("ownerUserId");

-- CreateIndex
CREATE INDEX "contacts_ownerUserId_idx" ON "contacts"("ownerUserId");
