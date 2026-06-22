# Package: CRM

Ядро AI Sales OS. Полное проектирование — `../../docs/011-crm-domain.md`.
Схема БД — `infrastructure/prisma/schema.prisma`.

## Подмодули
Companies, Contacts, Deals, Pipelines/Stages, Activities, Notes, Tags,
Products/DealProducts, CustomFields, Timeline, Search.

## Структура
```
domain/        entities, value-objects, events, repositories, services
application/   commands, queries, handlers, dto
infrastructure/prisma (schema + repositories)
presentation/  controllers (REST + WS)
tests/         unit + integration
```

## Ключевые правила
- Multi-tenant: `tenantId` везде, изоляция в репозиториях.
- CQRS: команды меняют агрегаты, события идут в Timeline/Automation/Analytics/AI.
- Интеграция с `counterparty-check`: при создании компании с ИНН — авто-проверка контрагента в Timeline и карточке.
