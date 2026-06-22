# ADR-012 — Entity Conventions

**Статус:** Принято (2026-06-21). Детализирует ADR-005.

## Каждая сущность содержит
```
id          UUIDv7
tenant_id   UUID
created_at  timestamptz
updated_at  timestamptz
deleted_at  timestamptz NULL   (soft delete)
version     int                (оптимистическая блокировка)
```

## Правила
- **Soft delete** везде (`deleted_at`), физического удаления нет.
- **Оптимистическая блокировка** через `version` (инкремент при каждом изменении; конфликт → 409).
- **No mutable IDs** — id неизменяем.
- **No business logic in DTO** — DTO только перенос данных.
- **Изменение состояния только методами агрегата** (никаких сеттеров/прямых правок полей).

## Базовый класс
`shared/aggregate-root.ts` и `shared/base-entity.ts` несут эти поля и `version`-логику,
плюс сбор доменных событий (`pullEvents()`).

## Связанные
ADR-005, ADR-009.
