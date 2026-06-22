# ADR-009 — Repository Pattern

**Статус:** Принято (2026-06-21). **Критично.**

## Решение
ЗАПРЕЩЕНО использовать Prisma Client напрямую в хендлерах/контроллерах.
Только через репозиторий:
```
Handler → Repository Interface (domain) → Prisma Repository (infrastructure) → Prisma Client
```

## Почему
- Доменный слой не зависит от ORM (тестируемость, замена реализации).
- Изоляция арендатора (`tenant_id` + RLS GUC) централизуется в репозитории.
- Единые точки для кэша, аудита, оптимистической блокировки.

## Проверка
Линт/ревью: импорт `PrismaService`/`PrismaClient` разрешён только в `infrastructure/`.

## Связанные
ADR-005, ADR-010.
