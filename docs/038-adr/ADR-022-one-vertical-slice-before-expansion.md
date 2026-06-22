# ADR-022 — One Vertical Slice Before Expansion

**Статус:** Принято (2026-06-21).

## Решение
До завершения первого полного вертикального среза (агрегат **Tenant**) ЗАПРЕЩЕНО
начинать: Organization, Settings, Subscription, Auth, Users, RBAC, CRM, Communication,
Telephony и т.д.

Цель среза — доказать сквозной путь для ОДНОГО агрегата:
```
HTTP → Controller → Command → Handler → Domain → Repository → Prisma → Postgres →
Response → Tests (green) → Swagger
```

## Definition of Done среза (с ADR-016/021)
Tenant compiles · unit/integration/e2e = CI_GREEN · Swagger up · POST/GET/PATCH работают
(с доказательством, ADR-020). Только тогда — следующий агрегат.

## Связанные
ADR-015, ADR-016, ADR-021.
