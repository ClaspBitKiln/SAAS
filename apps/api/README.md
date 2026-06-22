# apps/api — NestJS модульный монолит

Единственный backend AI Sales OS (ADR-001, ADR-004). Все bounded contexts — модули внутри.

## Структура
```
src/
  bootstrap/      main.ts, app.module.ts, swagger, socket, validation, exception-filter, logger
  config/         конфигурация (env)
  shared/         domain (aggregate-root, base-entity, domain-event, repository),
                  application (result, pagination), infrastructure (uuid), errors
  database/       prisma/ (prisma.service), client/
  events/         event-bus, outbox, subscribers, publishers
  queues/         BullMQ workers, processors
  websocket/      gateways, adapters, rooms
  health/
  modules/        platform, auth, users, rbac, crm, communication, tasks,
                  calendar, telephony, automation, ai, analytics
prisma/           собранный schema.prisma (из packages/<ctx>/prisma — ADR-014)
```

## Порядок сборки (ADR-002 / ADR-010)
```
shared → database → events → outbox → queues → websocket →
platform → auth → users → rbac → crm → communication → tasks →
calendar → telephony → automation → ai → analytics
```

## Каждый модуль (DDD)
`domain/ application/ infrastructure/ presentation/` + публичный `index.ts`
(экспорт интерфейсов/DTO/событий; внутренние слои не экспортируются — ADR-011).

## Ключевые правила
- Prisma только в infrastructure-репозиториях (ADR-009).
- Каждая сущность: id(UUIDv7), tenant_id, created_at, updated_at, deleted_at, version (ADR-012).
- Межмодульное взаимодействие — события (Outbox+BullMQ, ADR-006), не прямые импорты.
- tenant-guard выставляет `app.current_tenant` для RLS (ADR-003/005).

## Скелет bootstrap (создать первым)
`main.ts, app.module.ts, swagger.ts, socket.ts, prisma.ts, validation.ts, exception-filter.ts, logger.ts`
