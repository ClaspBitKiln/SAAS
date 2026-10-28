-- Some installations already created this model via migrate dev/schema sync.
CREATE TABLE IF NOT EXISTS "contact_notes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "contactId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "contact_notes_contactId_idx" ON "contact_notes"("contactId");
CREATE INDEX IF NOT EXISTS "contact_notes_organizationId_idx" ON "contact_notes"("organizationId");
