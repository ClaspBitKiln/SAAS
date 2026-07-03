# STEP 2026-07-03 — Contact→Company prod smoke (post PR #12 merge)

**Merge:** main `e135e41` (PR #12 `feat/contact-company-link`)  
**When:** 2026-07-03  
**Scope:** Railway redeploy verification only — no prod data mutation

## Checks

| Check | Result | Evidence |
|-------|--------|----------|
| API `/health` | PASS | `{"status":"ok","database":"up"}` |
| Swagger `CreateContactDto.companyId` | PASS | `GET /docs-json` on prod API |
| Swagger `ContactResponseDto.companyId` | PASS | same |
| Web contacts bundle `companyId` | PASS | `/_next/static/chunks/app/dashboard/contacts/page-881354bb301584cc.js` |
| Web company select label | PASS | `"No company"` in prod bundle (EN — RU deploy pending task 3) |
| MagicMet data | UNTOUCHED | no API writes |

## Notes

- Full authenticated API smoke (create contact + link company) deferred — no test credentials in repo; bundle + OpenAPI confirm deploy of PR #12 code.
- Prod web still shows pre-RU-UI strings (`No company`, `AI Revenue Execution CRM` meta) until RU UI commit deploys.

## URLs

- Web: https://web-production-e22e3.up.railway.app
- API: https://api-production-7f43a.up.railway.app
