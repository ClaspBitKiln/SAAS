# E-Metall integration (MagicMet / metal trading)

Source: product brief `ИИ-инструменты.pdf` — three standalone AI modules that expose results via **API** and **MCP**.

## Modules (external)

| Module | Purpose | Input | Output |
|--------|---------|-------|--------|
| **Фильтр заявок** | Decide if inbound mail is a metal procurement request | Email body + attachments meta | `{ relevant: boolean, confidence, reason }` |
| **Разбор заявок** | Parse PDF / Excel / Word / email text into line items | Raw files or text | Structured lines: GOST, steel grade, dimensions, length, thickness, coating, qty |
| **База Е-Металл** | Search supplier catalog for best offers | Parsed line items | Offers: price, region, lead time, stock, analogues |

Accuracy claim (vendor): ~98% on real metal requests.

## Input channels for заявка (product decision)

**All three — with different priority.**

| Channel | Who uses it | MVP priority | Flow |
|---------|-------------|--------------|------|
| **Manual form** | Менеджер в CRM | **P0** | Строки заявки вводятся руками: марка, ГОСТ, размер, толщина, кол-во → сразу в CRM → опционально Search в Е-Металл |
| **File upload** | Менеджер | **P0** | PDF / Excel / Word / **фото заявки** (jpg/png) → `POST …/jobs/parse` → AI разбирает → менеджер **проверяет и правит** → Search |
| **Email auto** | Система (фон) | **P2** | Почта → Filter → Parse → черновик заявки в CRM → менеджер подтверждает |

### Recommended UX (MagicMet)

```
/dashboard/requests/new
  ┌─────────────────────────────────────┐
  │ Tab 1: Вручную    Tab 2: Загрузить │
  ├─────────────────────────────────────┤
  │ [Контакт ▼]  [Комментарий]          │
  │ + Add line: марка | ГОСТ | размер…  │
  │   или                               │
  │ [📎 Drop file / photo]              │
  │   → «Разобрать» → таблица позиций   │
  │   → правка → «Найти в Е-Металл»     │
  └─────────────────────────────────────┘
```

**Правило:** AI не пишет в CRM без подтверждения человека (см. `docs/AI_RULES.md` — human confirms CRM writes).

**Фото:** не отдельный OCR в Sales OS — фото уходит в **Разбор заявок** E-Metall (как PDF). Если модуль не принимает фото — конвертация на стороне E-Metall или fallback «введите вручную».

## Target flow in Sales OS

```
Manual OR Upload (photo/PDF/Excel)
        ↓
  E-Metall Parse API  (skip Filter — менеджер уже решил, что это заявка)
        ↓
  Manager review / edit lines in UI
        ↓
  E-Metall Search API
        ↓
  Sales OS CRM
   · Contact (company from email)
   · Deal / Quote (line items + supplier offers)
   · Activity timeline entry
   · Optional: task for manager review

--- Later (P2) ---

Inbound email (IMAP / forward)
        ↓
  E-Metall Filter API
        ↓ (if relevant)
  … same parse → review → search path
```

## Integration style (same as inn-bot block)

- **Outbound:** NestJS `EMetallApiClient` calls vendor REST (or MCP bridge later).
- **Inbound:** `POST /integrations/e-metall/webhook` receives async job results from vendor.
- **No copy** of E-Metall ML models inside `apps/api` — adapter only.
- **Tenant-scoped:** every job stores `tenantId` + `organizationId`.

## API surface (Sales OS — this repo)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/integrations/e-metall/status` | JWT | Connection config + last sync (no secrets) |
| POST | `/integrations/e-metall/jobs/filter` | JWT | Submit raw email for filtering |
| POST | `/integrations/e-metall/jobs/parse` | JWT | Submit attachment/text for parsing |
| POST | `/integrations/e-metall/jobs/search` | JWT | Search catalog for parsed lines |
| POST | `/integrations/e-metall/webhook` | HMAC header | Vendor callback (job completed) |

## Environment

```env
EMETALL_API_BASE_URL=https://api.e-metall.example/v1
EMETALL_API_KEY=
EMETALL_WEBHOOK_SECRET=
EMETALL_ENABLED=false
```

When `EMETALL_ENABLED=false` or key missing, client returns structured `NOT_CONFIGURED` — CI stays green.

## CRM mapping (next slices)

| E-Metall output | CRM entity | Status |
|-----------------|------------|--------|
| Sender domain / company name | Contact + Company | Contact ✅, Company ❌ |
| Parsed line items | Deal line items | Deal ❌ |
| Supplier offers | Quote / Offer record | ❌ |
| Job audit | Activity timeline | ❌ |

## MCP (optional, Stage 2)

E-Metall modules also expose MCP. Sales OS can call them via Cursor MCP or a thin bridge in `apps/ai-service` — **not** in MVP slice.

## Related

- [ADR-027](../038-adr/ADR-027-e-metall-integration.md)
- [010-block-counterparty-check.md](../010-block-counterparty-check.md) — same adapter pattern as inn-bot
