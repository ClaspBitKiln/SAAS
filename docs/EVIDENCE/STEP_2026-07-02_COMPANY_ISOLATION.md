# STEP: Company isolation review

Commit:      `fab5d9f` (+ tenant-isolation e2e extension in follow-up)
CI:          [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202) (GREEN)
Production:  api + web Railway auto-deploy after `fab5d9f` push (expected SUCCESS)

## Code review — org-scope pattern

| Layer | Check | Result |
|-------|-------|--------|
| Controller | `@CurrentUser()` + `requireOrganizationId(user)` on all routes | PASS |
| Commands | `findById(id, organizationId)` before update/delete | PASS |
| Queries | `GetCompanyQuery` / `ListCompaniesQuery` scoped by org | PASS |
| Repository | `findById`, `findByInn`, `listByOrganization` always filter `organizationId` + `deletedAt: null` | PASS |
| Search | `organizationId` in `where`; `OR` only on name/inn/email within org | PASS |
| INN uniqueness | `findByInn(inn, organizationId)` — per org, not global | PASS |

## E2E coverage

| Test file | What it proves |
|-----------|----------------|
| `company.e2e-spec.ts` | CRUD flow, 401 without token |
| `company-search.e2e-spec.ts` | `?q=` returns only own org; no cross-org in search results |
| `tenant-isolation.e2e-spec.ts` | GET/PATCH/DELETE foreign company → 404 (added with first-user slice) |

## Isolation verdict

**PASS** — same pattern as Contact/Call/Request (F-013 resolved). No IDOR on Company routes.

## Notes

- `listByOrganization` ignores client-supplied `organizationId` query param (org from JWT only) — covered by contact list test in `tenant-isolation.e2e-spec.ts`; Company list uses same `requireOrganizationId` pattern.
- Phone/website not in search `OR` — intentional (DoD: name/inn/email only).
