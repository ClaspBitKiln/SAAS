# ADR-005 — Database Strategy

**Статус:** Принято (2026-06-21). Детализирует ADR-003 §1.

## Решение
- Один PostgreSQL (single database).
- `tenant_id` во всех арендных таблицах.
- **PostgreSQL RLS** включён (политика изоляции по `tenant_id`).
- **Soft delete** (`deletedAt`) где применимо.
- `created_at` и `updated_at` на каждой сущности.
- Идентификаторы — **UUIDv7** (сортируемые по времени, лучше для индексов, чем v4).
- НЕ schema-per-tenant и НЕ database-per-tenant.

## Замечание по Prisma
UUIDv7 генерировать на стороне приложения (npm `uuidv7`) и передавать в `id`, либо
функцией БД; не полагаться на `@default(uuid())` (это v4). Зафиксировать единый генератор в `shared`.

## Связанные
ADR-003, ADR-009.
