# Module: Platform — Tenant ✅ · Organization (await CI)

Контекст Platform. Golden Path по ADR-015.

## Tenant — DONE (CI_GREEN 2026-07-01)

## Organization — Module Completion Checklist

- [x] Entity — `domain/entities/organization.entity.ts`
- [x] Value Objects — `organization-name.vo.ts`, `inn.vo.ts` (правило из inn-bot: 10/12 цифр)
- [x] Repository Interface — `domain/repositories/organization.repository.ts`
- [x] Prisma schema — `organizations` table
- [x] Repository implementation — `infrastructure/prisma-organization.repository.ts`
- [x] Commands — `application/commands/organization.commands.ts`
- [x] Queries — `application/queries/organization.queries.ts`
- [x] Handlers — `application/handlers/organization.*`
- [x] Controllers — `presentation/controllers/organization.controller.ts`
- [x] DTO — create/update/response
- [x] OpenAPI — swagger decorators
- [x] Unit tests — inn, organization-name, organization.entity
- [x] Integration tests — prisma-organization.repository.spec.ts
- [x] E2E tests — organization.e2e-spec.ts
- [ ] CI_GREEN — await push + GitHub Actions

## API — Organization

```
POST   /organizations              создать (tenantId, name, inn?, settings?)
GET    /organizations/{id}         получить
GET    /organizations?tenantId=   список по tenant
PATCH  /organizations/{id}       обновить name/inn/settings
```

## API — Tenant

```
POST   /tenants            создать
GET    /tenants/{id}       получить
GET    /tenants            список (page,size)
PATCH  /tenants/{id}/activate
PATCH  /tenants/{id}/suspend
```

## Следующий агрегат (после Organization CI_GREEN)

Settings → Subscription → Audit
