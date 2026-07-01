# Module: Platform — Tenant ✅ · Organization ✅

Контекст Platform. Golden Path по ADR-015.

## Tenant — DONE (CI_GREEN 2026-07-01)

## Organization — DONE (CI_GREEN 2026-07-01)

- [x] CI_GREEN — run 28537484657, commit `e68ae91`

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

## Следующий шаг

Утвердить `docs/platform/authorization-model.md` → затем:

User → Membership → Role → Permission → Audit
