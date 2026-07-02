# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`. Снапшот → `docs/CURSOR_SYNC.md`.

---

CURRENT
**First live user + feedback** (prod onboarding)

STATUS
CONTINUE — onboard 1 real manager, capture structured feedback

INPUT
MVP CRM core DONE. Company `fab5d9f` CI_GREEN [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202). Isolation review PASS → `docs/EVIDENCE/STEP_2026-07-02_COMPANY_ISOLATION.md`. Founder decision **D-001**.

OUTPUT
Turnkey kit `docs/first-user/TURNKEY.md` · manager completes happy path in prod · feedback → `docs/EVIDENCE/FEEDBACK_*.md`

DONE WHEN
Real user registered in prod, used Contacts / Companies / Calls / Notes / Search, structured feedback recorded. Founder picks next slice from feedback.

OUT OF SCOPE
Deal pipeline · Contact→Company link · AI · counterparty-check · RBAC · E-Metall live

---

## MVP прогресс
| Срез | Статус |
|------|--------|
| Platform + Auth + Contact + Call + Request | DONE |
| CRM Lite: Notes + Search | DONE |
| Company CRUD + search | DONE (`fab5d9f`, run #78) |
| **First live user + feedback** | **CONTINUE** |
| Deal pipeline | backlog (until feedback) |
| Contact→Company | backlog (until feedback) |
| Activity timeline | backlog |

## First user — DoD
- Prod smoke OK (`/health`, register → dashboard)
- Manager onboarded (self-register or invite)
- Happy path: 3 contacts, 1–2 companies, 2 calls, notes, search
- Feedback file in `docs/EVIDENCE/`
- Founder decision on next aggregate

BLOCKERS
Нет.
