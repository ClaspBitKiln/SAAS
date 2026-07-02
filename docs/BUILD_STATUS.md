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

## История прогонов

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
