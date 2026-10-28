# Simple CRM: restore missing contact-note migration

Baseline: `8cc7e6dcb8681b838ac8cf8440f5e5a581351166`, branch `fix/crm-contact-notes-migration` (stacked on the simple-CRM autofill branch).

Problem: `apps/api/prisma/schema.prisma:ContactNote` and `PrismaContactNoteRepository` require `contact_notes`, but replaying the 14 previously committed migrations never created it. A new database could not support the note part of company → contact → note → next-action workflow. Earlier successful migrate-dev environments could conceal this gap by generating local migrations/schema changes.

Change: additive `20261028160000_contact_notes/migration.sql` matches the existing model: UUID identifiers, optional createdById, text body, timestamp defaults/nullability, primary key and contact/organization indexes. It uses IF NOT EXISTS because existing installations may already have the model through schema sync; no existing records are overwritten. It does not reconcile arbitrarily divergent pre-existing table definitions. Prisma model/application logic remain unchanged; no new foreign keys or tenant guarantees are implied.

Validation executed:

- `python3 scripts/test-contact-notes-migration.py`: PASS. All 15 migrations replayed against a unique disposable local PostgreSQL database; eight expected columns/types/nullability, three indexes, createdAt default, note insert/read verified. New migration reapplied with a retained note; note content/count preserved. Only the randomly named database created by that invocation was removed.
- Existing `contact-note.entity.spec.ts`: 2 tests passed.
- API lint and git diff whitespace check passed.

The standalone migration regression uses Compose PostgreSQL and Python stdlib, no extra dependencies or Prisma binary; schema/table assertions would fail without this new migration. It does not register Prisma migration history and does not replace Prisma migrate deploy/schema-diff validation.

Added negative E2E case in `contact-note.e2e-spec.ts`: another organization cannot POST a note to a foreign contact (expected 404). Existing own-contact create/list and foreign-contact read tests retained. Full E2E and API build remain NOT VERIFIED: Prisma downloads still blocked by the active proxy policy. No production database or real customer data touched. Runtime network custom hosts still empty when checked, despite saved draft additions.

Next: apply saved network settings, run Prisma generation/migrate deploy/schema parity and contact-note E2E, then exercise persisted company → contact → note → next task. GitHub API PR creation remains blocked until network settings apply; a pushed branch alone is not a PR or CI_GREEN.
