# Anti Goals

**We DO NOT build.** Non-negotiable scope guardrails.

| Category | We do NOT build |
|----------|-----------------|
| Clone | Bitrix24 clone, amoCRM clone |
| ERP | Accounting, warehouse, procurement |
| HR | HRM, payroll, org chart for whole company |
| Docs | Document management, wiki, corporate disk |
| Platform | No-code builder, marketplace, plugin ecosystem |
| Universal | "CRM for everyone" — we serve B2B SMB sales only |
| Enterprise | Multi-subsystem portals, Backstage-style internal platforms |
| Over-engineering | Kubernetes, graph DB, workflow engines before proven pain |

## Also deferred (not never, but not MVP)

- Full ATS / FreeSWITCH self-hosted telephony
- Kafka / event streaming at scale
- Multi-region deployment
- inn-bot feature parity inside CRM (reuse via block, not copy)

## When tempted

If a feature sounds like "Bitrix has this" → check [CUSTOMER_PAIN.md](./CUSTOMER_PAIN.md).  
No pain entry = **no build**.
