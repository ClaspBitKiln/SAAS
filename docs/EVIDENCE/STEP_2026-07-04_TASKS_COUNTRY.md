# STEP: Tasks («Сегодня») + Company country (CIS) + security throttle fix

Date:        2026-07-04
Executor:    Claude (код) + Founder (push ×3) — исключение ролей DECISIONS 2026-07-04
CI:          run **api #95** commit `1641dbd` — **GREEN** (кумулятивно: tasks, country, inn autofill, throttle fix)
Chain:       `2f1bc91` feat (RED #93, unit) → `7b932c8` test fix (RED #94, e2e → нашёл прод-баг) → `1641dbd` fix(security) (GREEN #95)

## Scope
1. **Tasks**: модуль (entity OPEN/DONE/CANCELLED, типы CALL/MESSAGE/MEETING/TODO, dueAt, assignee org-scoped default=создатель, contact/company links), `GET /tasks/today`, complete/cancel, миграция `20260704150000_task`, web-страница «Задачи» («Сегодня» + открытые + форма), пункт меню.
2. **Company.country** (RU/UZ/KZ/KG): валидация налогового номера по стране (10/12·9·12·14), migration `20260704160000_company_country`, VO Inn(country), web select + динамический label, «Заполнить по ИНН» только RU.
3. **F-017 PROD BUG FIX**: throttler 'auth' 5/min действовал глобально на все маршруты → 429 на 6-й записи за минуту. forRoot default → 600; строгие 5/min только на /auth/* через AuthThrottle().

## Prod smoke (2026-07-05, Cursor)

| Check | Result |
|-------|--------|
| `/health` | PASS |
| OpenAPI `/tasks/today` | PASS |
| OpenAPI `country` + `inn-lookup` | PASS |
| Web `/dashboard/tasks` chunk | PASS |
| MagicMet | UNTOUCHED (no writes) |
- F-016: deploy ≠ CI — Railway деплоит по push; CI_GREEN только по статусу run.
- F-017: named throttler в forRoot = глобальный; строгие лимиты — только декоратором. e2e с 6+ запросами на роут — детектор.

## Owner DoD (prod, после redeploy)
Меню «Задачи» → создать задачу → появляется в «Сегодня» (если срок сегодня/просрочен) → «Выполнено». Компании: select страны, УЗ-компания со СТИР 9 цифр сохраняется.
