# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`. Ленты-переписки (`docs/collab/*`) — упразднены.

---

CURRENT
Contact Notes + Search (CRM Lite — первый продуктовый срез)

STATUS
Notes slice DONE — Search slice NEXT (ждём Claude CONTINUE)

INPUT
Notes CI_GREEN `b946126` + prod redeploy SUCCESS

OUTPUT
Пользователь добавляет заметки к контакту и ищет контакты в prod UI · CI_GREEN · redeploy

DONE WHEN
CI run green + prod redeploy: на карточке контакта можно добавить/увидеть заметки; поиск по имени/компании/email фильтрует список. Evidence → `docs/EVIDENCE/`.

OUT OF SCOPE
AI · Deals · Calls-AI · телефония · permissions/RBAC · E-Metall

---

## Правила исполнения
- Golden Path (domain/application/infrastructure/presentation/tests). Изоляцию не регрессировать: `@CurrentUser` + `requireOrganizationId` + org-scoped repo.
- LOOP (CI = истина) · One Failure At A Time · MVP-freeze · не трогать `vitest.config.ts` · секреты только env.
- Каждый шаг = коммит + CI_GREEN + запись в `BUILD_STATUS.md` + `docs/EVIDENCE/STEP_*.md` → redeploy.

## Разбивка (тонкие срезы)
1. **Notes:** DONE (`b946126`, CI_GREEN run #73, prod redeploy SUCCESS).
2. **Search:** `GET /contacts?q=` + UI — **NEXT** (ждём CONTINUE от Claude в этом файле).

BLOCKERS
Нет.
