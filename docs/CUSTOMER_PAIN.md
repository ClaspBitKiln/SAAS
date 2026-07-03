# Customer Pain Ledger

Every feature must link to a pain ID.

| ID | Problem | Who | How often | Current solution | Sales OS solves | Evidence |
|----|---------|-----|-----------|------------------|-----------------|----------|
| P-001 | After a call, manager manually types notes into CRM | B2B sales manager | Daily (5–20 calls) | Bitrix/amo notes field, Excel | AI records + summarizes call → auto-fills contact/deal | Founder interviews (hypothesis) |
| P-002 | CRM feels like data entry, not selling | Sales manager | Daily | Skip CRM updates; manager nags | Telephony-first: speak, AI writes | North Star in [VISION.md](./VISION.md) |
| P-003 | No single view of customer communication | Team lead | Weekly | Email + phone + WhatsApp scattered | Unified timeline (MVP-2+) | Competitor gap: [ANTI_GOALS](./ANTI_GOALS.md) |
| P-004 | Onboarding new sales hire takes weeks | Sales director | Per hire | Manual training + Bitrix config | Simple product + invite flow | Platform: Tenant → Org → User → Invite |
| P-005 | Counterparty risk check is separate from deal | Manager | Per new client | inn-bot / external sites | INN check in company card (V2) | inn-bot exists; integrate later |
| P-006 | Managers forget follow-ups after calls | Manager | Daily | Sticky notes, Bitrix tasks | AI creates tasks from call summary | MVP AI slice |
| P-007 | Bitrix/amo too heavy or expensive for 5–10 seats | SMB owner | At purchase | Spreadsheets or overpay | Focused AI Sales OS, SMB pricing | [VISION.md](./VISION.md) |

## Usage

When proposing a feature:

```
Feature: <name>
Pain: P-00X
```

No pain ID → feature goes to [FEATURE_MATRIX.md](./FEATURE_MATRIX.md) **Never** column unless founder overrides.
