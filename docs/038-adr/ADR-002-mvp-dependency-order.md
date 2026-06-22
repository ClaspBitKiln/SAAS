# ADR-002 — MVP Dependency Order

**Статус:** Принято (владелец, 2026-06-21)
**Контекст:** В каком порядке строить контексты. Inbox — сердце продукта, но он
зависит почти от всего фундамента (Users, Tenants, RBAC, Permissions, Audit,
Settings, Notifications, Contacts, Companies, Deals, WebSocket). Начать с Inbox =
переделывать половину системы.

## Решение
Строим строго снизу вверх:

```
Stage 0  Platform Core   — Tenant, Organization, Subscription, Feature Flags, Audit, Settings
Stage 1  Identity        — Auth, Users, Sessions, RBAC
Stage 2  CRM Core        — Companies, Contacts, Deals, Pipelines, Stages, Activities, Timeline
Stage 3  Communication   — Conversation, Message, Attachment, Participants, Channels (настоящий Inbox)
Stage 4  Telephony
Stage 5  Automation
Stage 6  AI
Stage 7  Documents
Stage 8  Analytics
```

> Порядок проектирования контекстов: **Auth → Users → RBAC → Platform Core → CRM → Inbox → …**
> (фундамент identity/прав закладывается до бизнес-логики; Platform Core (tenants,
> подписки, аудит, шина) обвязывает всё). CRM уже спроектирован (`011-crm-domain.md`)
> и опирается на этот фундамент.

## Почему не Inbox первым
Inbox — не bounded context первого уровня: он опирается на Platform Core и Identity.
Его модель Conversation/Message связывается с Contact/Company/Deal и требует RBAC,
аудита, WebSocket и нотификаций. Поэтому Communication — Stage 3, не Stage 0.

## Последствия
- `002-blocks-and-sales-stages.md` (порядок MVP-1…8 по блокам) уточняется этим ADR:
  фактический порядок реализации — как выше.
- Кросс-cutting решения (мультиарендность, события, безопасность) — в `ADR-003`.

## Связанные
`ADR-001` (стек), `ADR-003` (multitenancy/events/security), `012-foundation-domains.md`.
