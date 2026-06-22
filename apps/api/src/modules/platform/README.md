# Module: Platform — Aggregate: Tenant

Первый реализованный агрегат (ADR-015 «No Big Bang»). Контекст Platform.

## Module Completion Checklist (ADR-015 §2) — Tenant
- [x] Entity — `domain/entities/tenant.entity.ts`
- [x] Value Objects — `tenant-name.vo.ts`, `tenant-status.vo.ts`, `plan-type.vo.ts`
- [x] Repository Interface — `domain/repositories/tenant.repository.ts`
- [x] Prisma schema — `packages/platform/prisma/schema.prisma`
- [x] Repository implementation — `infrastructure/prisma-tenant.repository.ts` (optimistic lock)
- [x] Commands — `application/commands/tenant.commands.ts`
- [x] Queries — `application/queries/tenant.queries.ts`
- [x] Handlers — `application/handlers/*`
- [x] Controllers — `presentation/controllers/tenant.controller.ts`
- [x] DTO — `create-tenant.dto.ts`, `tenant-response.dto.ts`
- [x] OpenAPI — через `@nestjs/swagger` декораторы в DTO/контроллере
- [x] Unit tests — `tests/unit/*`
- [x] Integration tests — `tests/integration/*` (нужна тест-БД)
- [x] ADR notes — этот файл

## API
```
POST   /tenants            создать
GET    /tenants/{id}       получить
GET    /tenants            список (page,size)
PATCH  /tenants/{id}/activate
PATCH  /tenants/{id}/suspend
```

## ADR notes / решения
- UUIDv7 id, `version` для оптимистической блокировки, soft delete (`deletedAt`) — ADR-005/012.
- Prisma только в `infrastructure` (ADR-009). Платформенный корень: `tenantId == id`.
- **События (ADR-006):** сейчас публикуются через NestJS `EventBus`. Маршрутизация через
  `event_outbox` подключается при готовности модуля `events/outbox` (он раньше Platform в
  порядке сборки и реализуется отдельным срезом). Это зафиксированное решение, не скрытый TODO.

## Запуск тестов
```
# unit (без БД)
vitest run src/modules/platform/tests/unit
# integration/e2e — поднять тест-БД, выставить DATABASE_URL, prisma migrate, затем vitest run
```

## Следующий агрегат (ADR-015 §3)
Tenant → **Organization** → Settings → Subscription → Audit.
