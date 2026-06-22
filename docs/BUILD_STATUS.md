# BUILD STATUS (журнал доказательств)

Правила: ADR-019 (No Assumed Green), ADR-020 (Evidence Driven), ADR-021 (CI = source of truth).
Статусы прогона: `NOT_RUN` · `LOCAL_GREEN` · `CI_GREEN` · `CI_RED`. Заявление без вывода = `UNPROVEN`.
**DONE даёт только `CI_GREEN`** (ADR-021). `LOCAL_GREEN` — промежуточный сигнал.

Обновлять при каждом реальном прогоне: команда + вывод (или ссылка на CI artifact / run).
Источник истины — пайплайн `.github/workflows/api.yml`.

## Tenant (контекст Platform) — IMPLEMENTED, ≠ DONE

| Проверка | Команда | Статус | Доказательство |
|----------|---------|--------|----------------|
| TypeScript compile | `pnpm build` | NOT_RUN | — |
| Unit tests | `pnpm test` | NOT_RUN | — |
| Integration tests | `pnpm test:integration` | NOT_RUN | — |
| E2E tests | `pnpm test:e2e` | NOT_RUN | — |
| Swagger up | `pnpm dev` → GET /docs | NOT_RUN | — |
| POST /tenants | curl/Swagger | NOT_RUN | — |
| GET /tenants/:id | curl/Swagger | NOT_RUN | — |
| PATCH activate/suspend | curl/Swagger | NOT_RUN | — |

**DoD (ADR-016):** все строки выше = GREEN с доказательством → Tenant = DONE → можно Organization.

## Примечание о среде генерации
Песочный shell ассистента в сессиях проектирования был недоступен (workspace booting/timeout),
поэтому прогоны не выполнялись — статусы честно `NOT_RUN`, а не `ASSUMED_GREEN` (ADR-019).
Заполнять таблицу при первом локальном/CI-прогоне.

## Шаблон записи прогона
```
Дата: 2026-06-__
Команда: pnpm test
Вывод:
<вставить хвост вывода: N passed / M failed>
Статус: GREEN | RED
```
