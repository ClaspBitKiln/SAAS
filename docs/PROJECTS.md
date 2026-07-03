# Экосистема — Sales OS + inn-bot + Shared Layer

> **Canonical shared layer:** `C:\Users\asus\Claude\Projects\founder-platform`

```
Founder Platform (shared engineering)
├── inn-bot       — независимый продукт
└── Sales OS      — независимый продукт (этот репо)
```

Не parent-child. Подробности: [founder-platform/ECOSYSTEM.md](../founder-platform/ECOSYSTEM.md)

## Репозитории

| Репо | Локальный путь |
|------|----------------|
| founder-platform | `C:\Users\asus\Claude\Projects\founder-platform` |
| inn-bot | `C:\Users\asus\CascadeProjects\inn-bot` |
| Sales OS | `C:\Users\asus\Claude\Projects\SAAS` |

## Переносы между проектами

[founder-platform/TRANSFER_RULES.md](../founder-platform/TRANSFER_RULES.md) — REUSE / ADAPT / REJECT + why.

**Never auto-merge:** domain, entities, Prisma schema, API, business logic.

## ADR

| Тип | Где |
|-----|-----|
| Process, CI, Golden Path | `founder-platform/adr/` |
| Stack, MVP, multitenancy (Sales OS) | `docs/038-adr/` |

Obsidian: `Documents/inn-bot/Memory/Founder/`
