# ADR-010 — Generation Order

**Статус:** Принято (2026-06-21). Важно для Cursor и Claude.

## Решение
Для каждого контекста генерировать строго по шагам (с проверкой после каждого):
```
1.  Entity / Aggregate
2.  Value Objects
3.  Repository Interface
4.  Prisma Schema
5.  Repository Implementation
6.  Commands
7.  Queries
8.  Handlers
9.  Controllers
10. DTO
11. OpenAPI
12. Tests
```

## Порядок контекстов (инфраструктура → бизнес)
```
shared → database → events → outbox → queues → websocket →
platform → auth → users → rbac → crm → communication → tasks →
calendar → telephony → automation → ai → analytics
```
Не начинать Platform Core с Tenant, пока не готовы shared/database/events/outbox/queues/websocket.

## Зеркало
Это правило также в `.cursor/rules/generation-order.mdc`.

## Связанные
ADR-002, ADR-008, ADR-009.
