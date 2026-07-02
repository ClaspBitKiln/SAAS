# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`. Ленты-переписки (`docs/collab/*`) — упразднены.

---

CURRENT
MVP CRM — **Company** aggregate (юрлица B2B, ИНН, search)

STATUS
CONTINUE — Company slice IN PROGRESS (Cursor)

INPUT
CRM Lite DONE (Contact + Notes + Search). Founder: «решай сам» → следующий MVP-срез.

OUTPUT
`GET/POST/PATCH/DELETE /companies` org-scoped + `?q=` (name/inn/email) + UI `/dashboard/companies` · CI_GREEN · redeploy

DONE WHEN
CI run green + prod redeploy: можно создать/найти юрлицо с ИНН в prod UI. Evidence → `docs/EVIDENCE/`.

OUT OF SCOPE
AI · Deal · Contact→Company link · counterparty-check · RBAC · E-Metall live

---

## MVP прогресс
| Срез | Статус |
|------|--------|
| Platform + Auth + Contact + Call + Request | DONE |
| CRM Lite: Notes + Search | DONE |
| **Company CRUD + search** | **CONTINUE** |
| Deal pipeline | backlog |
| Activity timeline | backlog |

## Company slice — DoD
- Prisma `Company` (name, inn?, website?, phone?, email?, org-scoped)
- API: CRUD + `GET /companies?q=` reuse (name/inn/email insensitive)
- Уникальность ИНН внутри org
- E2e: CRUD + cross-org isolation на search
- UI: `/dashboard/companies` (как Contacts)
- CI_GREEN + EVIDENCE

BLOCKERS
Нет.
