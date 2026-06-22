# ADR-014 — Prisma Schema Composition

**Статус:** Принято (2026-06-21). Уточняет ADR-005.

## Решение
НЕ держать один `schema.prisma` на несколько тысяч строк. Каждый контекст ведёт свою
схему, затем они собираются в единый рабочий файл генератором.

```
packages/platform/prisma/schema.prisma
packages/auth/prisma/schema.prisma
packages/users/prisma/schema.prisma
packages/rbac/prisma/schema.prisma
packages/crm/prisma/schema.prisma
...
            │  (build step: merge)
            ▼
apps/api/prisma/schema.prisma   ← собранный, по нему prisma migrate/generate
```

## Реализация
- Использовать `prismaSchemaFolder` (Prisma multi-file preview) ИЛИ простой merge-скрипт
  (`scripts/build-prisma.ts`), конкатенирующий per-context схемы в `apps/api/prisma/schema.prisma`.
- Общие `generator`/`datasource`/`enum` — в `packages/database/prisma/base.prisma`,
  не дублировать в каждом контексте.
- Источник истины — per-context файлы; собранный файл не редактировать руками.

## Замечание о текущих файлах
Существующие `packages/crm/infrastructure/prisma/schema.prisma` и
`packages/platform-core/infrastructure/prisma/schema.prisma` переносятся в
`packages/<ctx>/prisma/schema.prisma` при создании каркаса.

## Для Cursor/Claude
Маленькие per-context схемы намного легче сопровождать в AI-first проекте, чем один
огромный файл.

## Связанные
ADR-005, ADR-010.
