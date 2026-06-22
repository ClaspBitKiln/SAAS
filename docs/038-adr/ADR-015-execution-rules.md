# ADR-015 — Execution Rules (режим реализации)

**Статус:** Принято (2026-06-21). Действует с началом кодинга.

## Правило №1 — Architecture Freeze
До полного завершения **Platform → Auth → Users → RBAC** ЗАПРЕЩЕНО:
менять стек; вводить микросервисы; добавлять Kafka; переходить на Event Sourcing;
менять стратегию multi-tenancy; менять ORM.
Новые идеи — только в `docs/backlog/architecture-ideas/` со статусом ADOPT / DEFER / REJECT.

## Правило №2 — Module Completion Definition
Модуль/агрегат завершён, только если есть ВСЁ: Entity, Value Objects, Repository
Interface, Prisma schema, Repository implementation, Commands, Queries, Handlers,
Controllers, DTO, OpenAPI, Unit tests, Integration tests, ADR notes.
**Запрещено** оставлять «TODO позже».

## Правило №3 — No Big Bang
Никогда не генерировать весь контекст целиком. Внутри Platform порядок агрегатов:
```
Tenant → Organization → Settings → Subscription → Audit
```
К следующему агрегату — только после полного завершения предыдущего (по Правилу №2).

## Порядок агрегатов/контекстов (полный)
```
Tenant → Organization → Settings → Subscription → Audit →
Auth → Users → RBAC → CRM → Communication → Telephony → Automation → AI
```

## Режим
```
Design → Code → Test → Fix → Commit → Next
```
Архитектура служит реализации, а не наоборот.

## Связанные
ADR-002, ADR-010, ADR-013.
