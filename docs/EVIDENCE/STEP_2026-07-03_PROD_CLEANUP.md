# STEP: Production smoke account cleanup

Date:        2026-07-03
Operator:    Cursor (authorized chore, docs/NEXT.md task 1)
Scope:       Railway Postgres `ai-sales-os` production only — no code/deploy

## Target
- Email: `claude.smoke1@example.com`
- Workspace: «Smoke Test Co» (`smoke-test-co-mr3gav3g`)
- tenant_id: `019f22b1-eff8-7429-9538-7bdb8b95a454` (deleted)
- user_id: `019f22b1-f54e-79b9-afd7-ab41101ca8f2` (deleted)

## Safety check
- `users` with `%magicmet.ru%` in prod before delete: **1** — **not touched**
- Filter: strictly `tenant_id` of smoke account + smoke `user_id` for sessions/credentials

## SELECT counts BEFORE (tenant-scoped unless noted)

| Table | Count |
|-------|------:|
| sessions (user) | 1 |
| credentials (user) | 1 |
| contact_notes | 0 |
| calls | 0 |
| request_lines | 0 |
| requests | 0 |
| contacts | 1 |
| companies | 0 |
| memberships | 1 |
| organizations | 1 |
| users (smoke) | 1 |
| tenants (smoke) | 1 |

## DELETE order
sessions → credentials → contact_notes → calls → request_lines → requests → contacts → companies → memberships → organizations → users → tenants

## SELECT counts AFTER
All tables above: **0** for smoke tenant/user.

## Post-checks
- `GET /health` → `{"status":"ok","database":"up"}`
- `POST /auth/login` smoke email → **401**

## Notes
- One-off script run locally via `DATABASE_PUBLIC_URL` (not stored in repo/files).
- No schema/code/deploy changes.
