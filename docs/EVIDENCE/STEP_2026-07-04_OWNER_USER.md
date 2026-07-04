# STEP: Responsible manager (ownerUserId) on Company + Contact

Date:        2026-07-04
Executor:    Claude (code, files) + Founder (push via push-feature.bat) — role exception per DECISIONS 2026-07-04
Commit:      `293763e` feat(crm): responsible manager ownerUserId on company and contact
CI:          api run #91 — **GREEN** (1m17s, first attempt)
DoD:         CI_GREEN ✓ · default owner = creator ✓ (e2e) · org-scoped validation ✓ (e2e cross-org 404) · unset via null ✓ · RU UI selects ✓

## Scope

- Prisma: `ownerUserId UUID?` + index on `companies` and `contacts`; migration `20260704120000_owner_user`
- Domain: Company/Contact entities carry ownerUserId; set via updateDetails
- Application: `resolveOwnerUserId` — owner must hold ACTIVE membership in the org, else `Owner not found` → 404; create default = current user (JWT sub) — PRODUCT_PRINCIPLES #11 (self-filling)
- API: create/update DTOs `@IsUUID @IsOptional ownerUserId`; responses include ownerUserId
- Web: `use-org-members.ts` hook (ACTIVE members), «Ответственный» select in contact/company forms, «Отв.: Имя» in lists
- e2e: `company-owner.e2e-spec.ts` (4 tests) + `contact-owner.e2e-spec.ts` (3 tests)

## Verification

- Static (pre-push): grep all `create()`/`rehydrate()` callsites — compatible; pattern mirrors PR #12
- Local gate: husky pre-commit eslint — passed (commit created)
- CI run #91: lint · prisma · build · unit · integration · e2e — all green
- Prod: Railway auto-deploy from main; post-deploy check — OpenAPI `/docs-json` must contain `ownerUserId` in CreateContactDto/CreateCompanyDto

## Notes

- Cursor was out of tokens; CURSOR_SYNC.md update deferred until Cursor returns.
