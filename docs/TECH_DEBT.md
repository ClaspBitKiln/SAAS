# Tech Debt Ledger

Not TODO. Tracked debt with explicit trade-offs.

| ID | Debt | Reason | Risk | Priority | Evidence | Decision |
|----|------|--------|------|----------|----------|----------|
| TD-001 | User + Identity in one aggregate (MVP) | Ship faster; split later via ADR | Medium — migration if split wrong | P2 | `authorization-model.md` §3 | Accept for MVP; split when Auth sprint starts |
| TD-002 | Organization missing `slug` field | Shipped before slug in auth model | Low — URL/invite later | P2 | auth model vs current schema | Add migration with Membership sprint |
| TD-003 | No committed Prisma migrations folder | CI uses `migrate dev --name ci` | Low — works in CI | P3 | `.github/workflows/api.yml` | Add proper migrations when schema stabilizes |
| TD-004 | RBAC tables in legacy `platform-core` schema unused | Old scaffold not wired to apps/api | Low — dead schema file | P3 | `packages/platform-core/` | Do not import; delete when Platform complete |
| TD-005 | Event bus publish without outbox | YAGNI for MVP aggregates | Medium — lost events at scale | P3 | Tenant/Org handlers | Outbox when Communication domain starts |
| TD-006 | `prisma db push` on API container start | Fast Railway bootstrap without committed migrations | Medium — schema drift, no migration history in prod | P1 | `apps/api/Dockerfile` CMD | Move to `prisma migrate deploy` when schema stabilizes |

## Rules

- New debt → add row before merge.
- P0 debt blocks next aggregate.
- Pay down only when evidence shows pain (CI failure, customer blocker).
