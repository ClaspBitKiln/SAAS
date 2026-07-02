# CURSOR_SYNC — one-screen snapshot

> Обновлять при смене состояния. Канон задания: `docs/NEXT.md`. Не обрастать перепиской.

## Project

**AI Sales OS** — call-first B2B CRM (РФ/СНГ). Repo: `ClaspBitKiln/SAAS`. Stack: NestJS + TS + Prisma + PostgreSQL + Next.js.

## Roles

| Agent | Job |
|-------|-----|
| **Founder** | WHAT — приоритеты, решения |
| **Claude** | память, стратегия, review, `DECISIONS.md` |
| **Cursor** | HOW — код, CI, deploy, evidence |

Правила: CI = truth · one failure at a time · Founder не выбирает HOW, Cursor не выбирает WHAT.

## Prod (LIVE)

| | URL |
|---|-----|
| Web | https://web-production-e22e3.up.railway.app |
| API | https://api-production-7f43a.up.railway.app |
| Health | `GET /health` → `{"status":"ok","database":"up"}` |

## Done (CI_GREEN)

Platform (Tenant→Membership) · Contact · Call · Auth+JWT · Web shell · MVP self-service · Request scaffold · Tenant isolation P0 · Railway deploy · Contact Notes · Contact Search · **Company CRUD+search** (`fab5d9f`, [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202))

## CURRENT

**First live user + feedback** (D-001). Turnkey: `docs/first-user/TURNKEY.md`.

## Backlog (until feedback)

Deal pipeline · Contact→Company · AI · counterparty-check · RBAC · E-Metall live

## Read order (new session)

1. `docs/CURSOR_SYNC.md` (this file)
2. `docs/NEXT.md`
3. `docs/BUILD_STATUS.md` — CI evidence
4. `docs/DECISIONS.md` — strategy

## Work loop

```
NEXT.md → implement → lint/build/test → push → CI_GREEN → EVIDENCE → update BUILD_STATUS + NEXT → STOP
```

## Sync for Edge

- Repo open → read this file + NEXT.md
- No repo → paste this file into chat as bootstrap context
