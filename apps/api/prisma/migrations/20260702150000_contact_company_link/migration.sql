-- AlterTable
ALTER TABLE "contacts" ADD COLUMN "companyId" UUID;

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");
