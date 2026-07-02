# STEP: Contact Search (CRM Lite slice 2)

Commit:      `6edbaeb`
CI:          [run #74](https://github.com/ClaspBitKiln/SAAS/actions/runs/28593753542) (GREEN)
Production:  api + web Railway auto-deploy after push (expected SUCCESS)
DoD:         `GET /contacts?q=` org-scoped insensitive contains on name/email; UI search field; e2e isolation
Schema note: Contact has no `company` field — search covers name + email only (matches Prisma model)
Isolation:   `organizationId` always in where clause; e2e asserts no cross-org results; empty `q` = full list
