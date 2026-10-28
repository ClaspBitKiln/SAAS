# AI Sales OS — initial audit and simple CRM iteration, 2026-10-28

## Scope and decision

User priority refined to a simple CRM with automated information collection. Keep existing NestJS/Next.js/Prisma/PostgreSQL modular monolith. First workflow: paste company details/email signature → extract explicit contact data → review → save through existing company form. No autonomous supplier outreach, production changes, paid services or real messages. This is an initial evidence report, not completion of the requested full-market/full-branch audit or seven-stage product.

Baseline: SAAS `d4309bcde2f21abdb4826d025a6cb1bfa692b19d`, same as remote main at fetch. Existing work tree initially clean. Created separate working branches; no historical branch merges.

## Implemented

Simple CRM branch `feat/simple-crm-enrichment`:

- `apps/web/src/lib/company-intake.ts`: `extractCompanyInformation` extracts explicitly labelled company name and Russian INN, email, labelled/international phone and HTTP(S)/www website. Multiple distinct candidates remain unfilled. No network calls, LLM, inferred contact facts or automatic verification date.
- `fillEmptyCompanyFields`: preserves manager-entered values and unrelated metadata. Original text is copied into the manager comment only if empty; existing source/comment is preserved. Source marked as requiring review. New fields are not automatically saved.
- `apps/web/src/app/dashboard/companies/page.tsx`: optional “Заполнить из текста” section, 4,000-character limit, review and ambiguity notices, existing Save remains the confirmation step. No backend/API contract or migration changes.
- `apps/web/tests/company-intake.test.mjs`: six meaningful extraction, ambiguity, foreign-ID, unsafe URL and preservation tests. Test loader uses existing TypeScript dependency and ES2020 target; no new dependencies. `apps/web/package.json` exposes `test`; web CI invokes it.

Separately preserved price safety branch `feat/ai-sales-audit-intake-safety`, commit `1d47506`: strict numeric price import rejects negative/signed/annotated/unsafe values rather than stripping their meaning. Eleven new parser cases and two isolated HTTP adapter tests passed. This branch is not included in the simple CRM implementation.

## Readiness map

Statuses apply only to the stated evidence boundary. Passed unit tests do not establish persisted application behavior.

| Capability | Status | Evidence and limit |
|---|---|---|
| Web build and Russian sign-in page | WORKING | Next 15.5.20 production build passed; local /login HTTP 200 with Russian form; no backend login verified |
| New company-text extraction | WORKING | Six tests passed; actual rendered form checked with explicitly mocked API; screenshot `crm-intake.png` |
| Existing company/contact/task CRUD | NOT VERIFIED | Controllers, scoped repositories, domain tests and E2E sources exist; full runtime blocked by Prisma download |
| Organization/tenant/auth domain | PARTIAL | Baseline unit tests passed; cross-tenant E2E exists but not run; no blanket isolation guarantee |
| Notes after fresh migrations | BROKEN | Clean SQL migration replay produced 12 tables, omitting `contact_notes` required by schema.prisma ContactNote and PrismaContactNoteRepository |
| Existing request parser XLSX/PDF | PARTIAL | Existing 11 parser tests passed; no original binary storage or complete API persistence verified |
| Quote/follow-up/outcome domain | PARTIAL | Existing 11 request domain tests passed; persisted workflows not run |
| Real SMTP proposal delivery | NOT VERIFIED | Sender exists; two service unit tests passed; no real messages sent |
| Company import | PARTIAL | Existing /companies/import endpoint and organization-scoped command path; no full customer import run |
| Existing INN enrichment | NOT VERIFIED | DaData mapper unit tests passed; supplied local credential configured, outbound call blocked before credential validity established |
| Secure website intake | NOT IMPLEMENTED in main | Branch-only public intake reviewed; no automatic merge; proposed contract in magic-metal.md |
| RBAC across all operations | NOT VERIFIED | Membership/owner guards and isolation tests exist; no complete role/action matrix verified |
| Durable queue/outbox | NOT IMPLEMENTED in app bootstrap | Redis launched; no BullMQ dependency or worker registered in inspected API bootstrap |
| Full deals/pipelines/inbox/telephony | SPEC ONLY / NOT VERIFIED | README specs not treated as runtime implementation; no complete scenario demonstrated |
| AI agents and safety runtime | NOT VERIFIED | No executed tenant-scoped agent workflow; no claims of safe autonomous collection |
| Subscription payments/quotas | NOT VERIFIED | Plan enum exists; no paid billing activated or quota enforcement demonstrated |
| Backup restore, cache/files/jobs/search/WebSocket isolation | NOT VERIFIED | No restore or cross-tenant coverage demonstrated for these surfaces |

## Checks actually completed

- Frozen install with pinned pnpm 9.0.0: dependency resolution/install completed; Prisma postinstall reported blocked engine checksum download. Lockfile unchanged. No checksum/TLS bypass used.
- Baseline API: **22 files / 83 unit tests passed**. Root lint (API + web) passed.
- Web production build passed before and after new CRM form/helper changes. Six new web tests passed after correcting the test loader compilation target. No assertions disabled.
- Chromium UI smoke: fills five fields, shows review notice, preserves manager-overwritten email. API routes mocked and fixture auth state used only in this local UI harness; this is not authentication, tenant isolation, real data collection or persistence evidence. Script `/workspace/research/crm-browser-smoke.mjs`.
- REA **6.8.0** on official Node **24.22.1** (archive SHA256 verified against official SHASUMS): local unauthenticated `/dashboard/requests` navigates to `/login`, password input visible. `rea-login-evidence.json` Evidence ID `ev_bd1c058d02c45e3c959d220c6b81ef7f13a1d5e71ad6a2c2b90b73992243e10a`. Competitor behavior was not dynamically tested with REA.
- REA MCP official setup: `ready`, Codex registration `aligned`; existing configuration inspected by names only, backup `/home/agent/.codex/config.toml.before-rea-onboarding.backup`, installer also retains its recovery backup. Current tool list may require a client restart.
- PostgreSQL 16 and Redis 7 containers launched. `pg_isready`: accepting; Redis: `PONG`. All 14 existing migration SQL files applied successfully in a separate empty `onboarding_migration_audit` database via psql. This is SQL replay evidence, not Prisma migrate tracking or schema-diff validation; missing notes table confirmed afterward.
- Magic Metal: 21 targeted pure-function tests passed using SAAS Vitest 2 rather than site-pinned Vitest 4. Details and limitations in magic-metal.md.
- Additional price branch: 94 API unit cases passed before adding two HTTP adapter cases; those two separately passed (96 distinct cases total, not one all-suite run).

## Blockers and access configuration

Git read/fetch and push dry-run succeed through existing HTTPS proxy. Sandbox networking was unavailable; approved execution outside sandbox enabled the same configured proxy. No alternate network path or authentication bypass used.

GitHub API `api.github.com`, Prisma `binaries.prisma.sh` and DaData `suggestions.dadata.ru` blocked by proxy. Prisma checksum fetch and domain CONNECT probes returned 403; GitHub API returned Forbidden with both existing and user-supplied token. Credential failure is not established by a policy denial. No need to request a duplicate GitHub token.

User-supplied document inspected as data. Secret values were not printed, committed or included in saved scripts. DaData local variable file prepared under `/workspace/.local-credentials` with directory mode 700/file mode 600. This local binding is distinct from a populated platform vault binding. Other account credentials not needed for this workflow were not used.

Draft saved fields: `install_script`, `start_skill`, custom domains `binaries.prisma.sh`, `api.github.com`, `suggestions.dadata.ru`, and requirement `DADATA_API_KEY` for suggestions.dadata.ru. Preset domains preserved. Save confirmed; not applied or published. Available tools cannot publish the environment or enter a secret value into its vault. User must review/save settings and publish to apply policy. No production infrastructure changed.

API client generation failed due blocked checksum download. Consequently API build failed with missing generated Prisma types. Integration and full E2E not run. Environment must not be called ready until Prisma, missing ContactNote migration and required API workflow checks are resolved. No code was changed to mask these setup failures.

## Research artifacts and next work

- [Branches](branches.md), [machine-readable inventory](branches.json): all fetched agent branches inventoried; seven priority branches inspected in more depth. Dependency freshness, semantic conflicts and all branch runtime outcomes remain incomplete. Squash merge/patch equivalence is distinguished from commit reachability.
- [Magic Metal](magic-metal.md): main and two requested branches, exact SHAs, unsafe procurement findings, reuse decisions and signed idempotent site → SaaS contract proposal.
- [Competitors](competitors.md): source-backed initial comparison with exact revision links, licence boundaries and explicit coverage gaps. No competitor code copied.

Next highest value: apply required network policy, verify DaData key read-only, resolve missing notes migration, run API build/integration/E2E including cross-organization isolation, then exercise create-company → contact → note → next-task with real local persistence. Add source-preserving INN enrichment only after access verification; do not claim autonomous web research from deterministic pasted-text extraction. No speed improvement claimed without manager baseline measurements.

Commits/PR status will be reported from actual Git results. A comparison URL is not a created PR; blocked GitHub API prevents a PR readiness or CI_GREEN claim.
