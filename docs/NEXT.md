# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`.

---

CURRENT
Company = DONE. MVP CRM core: Contact + Company + Notes + Search + Call + Request.

STATUS
STOP по коду. Следующий срез — решение Founder (Deal pipeline / первый пользователь / Contact→Company link).

INPUT
Company CI_GREEN `fab5d9f` + prod redeploy.

OUTPUT
Юрлица B2B в CRM: создать компанию с ИНН, найти через search в prod UI.

DONE WHEN
CI_GREEN + evidence записаны. ✓

OUT OF SCOPE
AI · Deal · Activity timeline · Contact.companyId link · counterparty-check · RBAC

---

## MVP прогресс
| Срез | Статус |
|------|--------|
| Platform + Auth | DONE |
| Contact + Notes + Search | DONE |
| Call + Request scaffold | DONE |
| **Company CRUD + search** | **DONE** (`fab5d9f`, run #78) |
| Deal pipeline | backlog |
| Первый пользователь + фидбек | backlog (DECISIONS) |

BLOCKERS
Решение Founder: Deal vs первый пользователь vs связка Contact→Company.
