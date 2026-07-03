# BUILD STATUS (журнал доказательств)

Правила: ADR-019 (No Assumed Green), ADR-020 (Evidence Driven), ADR-021 (CI = source of truth).
Статусы прогона: `NOT_RUN` · `LOCAL_GREEN` · `CI_GREEN` · `CI_RED`. Заявление без вывода = `UNPROVEN`.
**DONE даёт только `CI_GREEN`** (ADR-021). `LOCAL_GREEN` — промежуточный сигнал.

Обновлять при каждом реальном прогоне: команда + вывод (или ссылка на CI artifact / run).
Источник истины — пайплайн `.github/workflows/api.yml`.

## Tenant (контекст Platform) — **DONE** (CI_GREEN 2026-07-01)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run #13](https://github.com/ClaspBitKiln/SAAS/actions/runs/28534981949) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `0e24f73` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28534981949

**DoD (ADR-016):** Tenant = DONE.

## Organization (контекст Platform) — **DONE** (CI_GREEN 2026-07-01)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28537484657) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `e68ae91` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28537484657

**DoD (ADR-016):** Organization = DONE.

## User (контекст Platform) — **DONE** (CI_GREEN 2026-07-01)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28540666372) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `920c0ce` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28540666372

**DoD (ADR-016):** User = DONE.

## Membership (контекст Platform) — **DONE** (CI_GREEN 2026-07-01)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28541063138) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `6163239` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28541063138

**DoD (ADR-016):** Membership = DONE.

## Contact (контекст CRM) — **DONE** (CI_GREEN 2026-07-01)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28542030630) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `fe2f2c0` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28542030630

**DoD (ADR-016):** Contact = DONE.

## Call (контекст CRM) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28564317587) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `308ce31` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28564317587

**DoD (ADR-016):** Call = DONE.

## Auth — Credential + Login (контекст Platform) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28565146632) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `c6da95b` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28565146632

**DoD (ADR-016):** Auth login (Credential + JWT) = DONE.

## Auth — Session + Refresh (контекст Platform) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28565452927) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `b51faa5` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28565452927

**DoD (ADR-016):** Session + Refresh = DONE.

## Web Shell (контекст Frontend) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` (apps/web) | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28566071494) |
| Next.js build | `pnpm build` (apps/web) | CI_GREEN | same run (job `web-build`) |
| API regression | `build-test` job | CI_GREEN | same run |

**CI proof:** commits `85bb8db` + `488bb99` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28566071494

**DoD:** Login UI + Dashboard + Contacts/Calls pages = DONE.

## Web — Dashboard live stats — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` (apps/web) | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28567675753) |
| Next.js build | `pnpm build` (apps/web) | CI_GREEN | same run (job `web-build`) |
| API regression | `build-test` job | CI_GREEN | same run |

**CI proof:** commit `08e9f59` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28567675753

**DoD:** Dashboard shows live contact/call totals from API.

## Auth — JWT Guard (CRM routes) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28572007693) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |

**CI proof:** commit `9358b36` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28572007693

**DoD:** Global `JwtAuthGuard` protects `/contacts` and `/calls`; platform/auth routes `@Public()`; e2e 401 tests.

## Web — MVP self-service flows — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` (apps/web) | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28572674729) |
| Next.js build | `pnpm build` (apps/web) | CI_GREEN | same run (job `web-build`) |
| API regression | `build-test` job | CI_GREEN | same run |

**CI proof:** commit `e9cf69c` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28572674729

**DoD:** Register → Invite → Login → Contacts CRUD → Log calls — full UI flow without API bootstrap.

## Request MVP + E-Metall scaffold — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28576198746) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run |
| Web build | `pnpm build` (apps/web) | CI_GREEN | same run (job `web-build`) |

**CI proof:** commit `5e837a8` (includes `53d6890` feat) → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28576198746

**DoD:** Request parse/create/search API + E-Metall scaffold + web `/dashboard/requests/*`.

## Tenant isolation (P0 security) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28577440195) |
| Prisma generate + migrate | CI steps | CI_GREEN | same run |
| TypeScript compile | `pnpm build` | CI_GREEN | same run |
| Unit tests | `pnpm test` | CI_GREEN | same run |
| Integration tests | `pnpm test:integration` | CI_GREEN | same run |
| E2E tests | `pnpm test:e2e` | CI_GREEN | same run (incl. tenant-isolation) |
| Web build | `pnpm build` (apps/web) | CI_GREEN | same run |

**CI proof:** commit `a6f1d89` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28577440195

**DoD:** `@CurrentUser` + org-scoped repos; tenant A cannot read/mutate tenant B data (e2e proof). F-013 RESOLVED.

## Deploy scaffold (Railway) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| Lint | `pnpm lint` | CI_GREEN | [run](https://github.com/ClaspBitKiln/SAAS/actions/runs/28580480073) |
| Build + tests | CI `build-test` | CI_GREEN | same run |
| Web build | CI `web-build` | CI_GREEN | same run |
| Health e2e | `GET /health` | CI_GREEN | same run |

**CI proof:** commit `e2ddee6` → workflow `api` → **success**
https://github.com/ClaspBitKiln/SAAS/actions/runs/28580480073

**DoD:** Dockerfiles + `railway.json` + `/health` + `docs/deploy/railway.md`. **Prod deploy** = отдельный шаг в Railway UI.

## Railway production — **DONE** (LIVE 2026-07-02)

| Шаг | Статус | Доказательство |
|-----|--------|----------------|
| Postgres plugin | LIVE | Railway project `ai-sales-os`, ref `${{Postgres.DATABASE_URL}}` |
| API service ACTIVE | LIVE | `railway service status --service api` → SUCCESS |
| Web service ACTIVE | LIVE | `railway service status --service web` → SUCCESS |
| `GET /health` | LIVE | `{"status":"ok","database":"up"}` |
| Web `/register` | LIVE | HTTP 200 |
| Prod smoke (API) | LIVE | tenant → org → user → membership → login → contact |

**URLs:**
- API: https://api-production-7f43a.up.railway.app
- Web: https://web-production-e22e3.up.railway.app

**Deploy commits:** `c8c4482` (tsconfig in Docker) → `9e27991` (openssl + Prisma binary target for Alpine).

**Prod smoke (CLI, 2026-07-02):** full onboarding chain + `POST /contacts` with JWT → `SMOKE_OK`.

**Owner DoD (browser):** Register → Login → Dashboard → Contact — **DONE** (claude.smoke1@example.com, Contacts=1, 2026-07-02).

## Production hardening (STEP 1 P0) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| Rate limit `/auth/login` + `/auth/set-password` | CI_GREEN | 5/min/IP · `auth-rate-limit.e2e-spec.ts` |
| Pino structured logging + request-id | CI_GREEN | prod `x-request-id`; redact secrets |
| `/health` skip throttle | CI_GREEN | `@SkipThrottle()` |
| CI_GREEN | **DONE** | commit `4d1083d` → [run #67](https://github.com/ClaspBitKiln/SAAS/actions/runs/28589153902) |
| Railway redeploy | **DONE** | api SUCCESS; prod `x-ratelimit-limit-auth: 5` |

**Note:** `/auth/register` не существует; регистрация = onboarding + `POST /auth/set-password`.

## Contact Notes (CRM Lite slice 1) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| `POST/GET /contacts/:id/notes` | CI_GREEN | `contact-note.e2e-spec.ts` |
| Org isolation | CI_GREEN | 404 cross-org; Claude review PASS |
| Web UI Notes panel | CI_GREEN | `apps/web/.../contacts/page.tsx` |
| Railway redeploy | LIVE | api + web SUCCESS |

**CI proof:** commit `b946126` → [run #73](https://github.com/ClaspBitKiln/SAAS/actions/runs/28592344724)

## Contact Search (CRM Lite slice 2) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| `GET /contacts?q=` filter | CI_GREEN | `contact-search.e2e-spec.ts` (3 tests) |
| Org isolation | CI_GREEN | cross-org never in results; `organizationId` in repo where |
| Integration search | CI_GREEN | `prisma-contact.repository.spec.ts` |
| Web UI search field | CI_GREEN | `apps/web/.../contacts/page.tsx` |
| Railway redeploy | LIVE | auto-deploy after `6edbaeb` push |

**CI proof:** commit `6edbaeb` → [run #75](https://github.com/ClaspBitKiln/SAAS/actions/runs/28593753542)

**CRM Lite slice 1–3:** Contact CRUD + Notes + Search = DONE (awaiting founder isolation check in prod UI)

## Company (MVP CRM slice) — **DONE** (CI_GREEN 2026-07-02)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| `GET/POST/PATCH/DELETE /companies` | CI_GREEN | `company.e2e-spec.ts` |
| `GET /companies?q=` search | CI_GREEN | `company-search.e2e-spec.ts` |
| Unique INN per org | CI_GREEN | Prisma `@@unique([organizationId, inn])` + handler |
| Web UI Companies page | CI_GREEN | `apps/web/.../companies/page.tsx` |
| Railway redeploy | LIVE | auto-deploy after `fab5d9f` |

**CI proof:** commit `fab5d9f` → [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202)

## Git hygiene (chore) — **DONE** (CI_GREEN 2026-07-03)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| WIP Contact→Company isolated | DONE | branch `feat/contact-company-link` (`fb596ca`), pushed |
| `main` product code clean | DONE | no companyId / migrations on main |
| `docs/**` tracked | DONE | commit `77bfeb7` |
| `.env.local` gitignored | DONE | commit `a7375be` |
| CI on main (docs-only) | CI_GREEN | [run #82](https://github.com/ClaspBitKiln/SAAS/actions/runs/28662890270) |

**Evidence:** `docs/EVIDENCE/STEP_2026-07-03_GIT_HYGIENE.md`

## Prod cleanup (chore) — **DONE** (2026-07-03)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| Smoke account removed | DONE | `claude.smoke1@example.com` tenant deleted |
| MagicMet prod data | UNTOUCHED | 1 user `%magicmet.ru%` remains |
| `/health` | OK | `database: up` |
| Smoke login | 401 | post-delete |
| Code/deploy | NONE | data-only |

**Evidence:** `docs/EVIDENCE/STEP_2026-07-03_PROD_CLEANUP.md`

## F-014 local .env + prod e2e junk — **DONE** (2026-07-03)

| Проверка | Статус | Доказательство |
|----------|--------|----------------|
| apps/api/.env localhost | DONE | no prod URL in repo |
| e2e-auth tenants in prod | 0 | scan 2026-07-03 |
| Smoke tenant removed | DONE | smoke-1782992706 deleted |
| MagicMet prod data | UNTOUCHED | m1@magicmet.ru + 3 contacts |

**Evidence:** `docs/EVIDENCE/STEP_2026-07-03_F014.md`

## История прогонов

```
Дата: 2026-07-02
Commit: 9e27991 fix(deploy): openssl and prisma binary target for alpine railway
Railway: api + web SUCCESS; GET /health → ok; prod smoke SMOKE_OK
```

```
Дата: 2026-07-02
Commit: e2ddee6 feat(deploy): add Railway Docker config and health endpoint
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28580480073
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e, web-build — all passed)
```

```
Дата: 2026-07-02
Commit: 5e837a8 docs: record variant A decision and STEP 0-1 execution order
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28576198746
Статус: CI_GREEN (api build-test + web-build — all passed; includes 53d6890 Request MVP)
```

```
Дата: 2026-07-02
Commit: a6f1d89 fix(security): enforce tenant isolation on CRM routes
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28577440195
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28572674729
Статус: CI_GREEN (api build-test + web-build — all passed)
```

```
Дата: 2026-07-02
Commit: 9358b36 feat(api): protect CRM routes with JWT guard
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28572007693
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-02
Commit: 08e9f59 feat(web): show live dashboard stats
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28567675753
Статус: CI_GREEN (api build-test + web-build — all passed)
```

```
Дата: 2026-07-02
Commit: 85bb8db feat(web): bootstrap Next.js app shell with login
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28566071494
Статус: CI_GREEN (api build-test + web-build — all passed)
```

```
Дата: 2026-07-02
Commit: b51faa5 feat(auth): add Session aggregate with refresh
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28565452927
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-02
Commit: c6da95b feat(auth): add Credential aggregate with login
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28565146632
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-02
Commit: 308ce31 feat(calls): add Call aggregate
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28564317587
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-01
Commit: fe2f2c0 feat(contacts): add Contact aggregate
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28542030630
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28541063138
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-01
Commit: 920c0ce feat(users): add User aggregate
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28540666372
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-01
Commit: e68ae91 feat(platform): add Organization aggregate
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28537484657
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-07-01
Commit: 0e24f73 fix(test): emit decorator metadata in vitest via SWC
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28534981949
Статус: CI_GREEN (lint, prisma, build, unit, integration, e2e — all passed)
```

```
Дата: 2026-06-26
Commit: af7ef57 fix(ci): remove duplicate pnpm version from action-setup
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/28282816006
Статус: CI_RED (E2E: POST /tenants → 500)
```

```
Дата: 2026-06-22
Commit: 1ba34c1 chore: bootstrap ai-sales-os
CI run: https://github.com/ClaspBitKiln/SAAS/actions/runs/27943596268
Статус: CI_RED (pnpm duplicate version, ~35s)
```
