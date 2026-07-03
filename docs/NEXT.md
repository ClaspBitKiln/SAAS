# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`.

---

CURRENT
**Первый живой пользователь + фидбек** (решение зафиксировано в DECISIONS 2026-07-02). НЕ код.

STATUS
STOP по коду (MVP-freeze). Активный шаг — за Founder: пригласить одного реального менеджера и собрать фидбек.

INPUT
MVP CRM-ядро закрыто и изолировано (Claude review PASS): Contact + Company + Notes + Search + Call + Request scaffold, prod LIVE.

OUTPUT
Один реальный B2B-менеджер прошёл в prod Register→Login→Contact→Note→Search→Company без помощи; фидбек записан.

DONE WHEN
Activation достигнута (signup→login→≥1 contact) + 3 ответа фидбека записаны в Obsidian `Memory/SAAS/`.

OUT OF SCOPE (до фидбека)
Deal pipeline · AI · Activity timeline · counterparty-check · RBAC · Communications/мессенджеры · UX-полировка (debounce/phone/company-search/FTS)

## Задания Cursor (по порядку, DECISIONS 2026-07-03)

### 1. PROD CLEANUP — **DONE** (2026-07-03, evidence `STEP_2026-07-03_PROD_CLEANUP.md`)

### 2. UNFREEZE: Contact→Company link — **CLAUDE REVIEW: PASS** (2026-07-03, afbea50)

Проверено Claude по диффу `main...feat/contact-company-link`:
- ✅ org-scope: `resolveCompanyId` → `companyRepo.findById(companyId, organizationId)`, cross-org → 404 (не раскрывает существование)
- ✅ back-compat: `companyId` nullable/optional; `null` снимает связь, `undefined` не трогает
- ✅ DTO: `@IsUUID @IsOptional`; response включает companyId
- ✅ e2e: same-org link + unlink + cross-org create/update → 404
- ✅ миграции: baseline `051451_local` НЕ содержит companies → конфликта с `140000_company` нет; порядок 051451→140000→150000 валиден для CI `migrate dev`
- ℹ️ non-blocking: baseline не содержит requests/contact_notes (CI доберёт auto-diff) — консолидировать при TD-006

**Условия merge:**
1. ✅ **F-014 fix (DONE 2026-07-03):** `apps/api/.env` → localhost; prod scan+cleanup — evidence `STEP_2026-07-03_F014.md`. e2e-auth tenants: 0; smoke-1782992706 removed; MagicMet untouched.
2. ✅ **CI_GREEN на PR #12** (2026-07-03: `api` on pull_request — build-test ✓, web-build ✓; подтверждено Claude по скрину Checks).

**Ожидает Founder:** merge PR #12 → redeploy → prod smoke «контакт + компания» → Cursor task 3 RU UI.

### 3. RU UI (явное задание Founder 2026-07-03: «по-русски всё меню должно быть»)
Локализовать web UI на русский: меню (Dashboard→Панель, Contacts→Контакты, Companies→Компании, Calls→Звонки, Requests→Заявки, Team→Команда), формы register/login/set-password, страницы контактов/компаний/заявок, кнопки/плейсхолдеры/ошибки валидации.
Просто и без боли: без i18n-фреймворка — статичные русские строки (или один `ru.ts` словарь). EN не сохранять. Код/API/БД остаются английскими.
DoD: в UI нет видимых английских строк на happy path · web-build CI_GREEN · redeploy · скриншот-проверка Founder.

Порядок: 1 → 2 → 3, One Failure At A Time. После п.3 — приглашение первого менеджера (русский UI до его прихода).

---

## MVP прогресс (всё DONE, prod)
Platform+Auth · Contact+Notes+Search · Company CRUD+search (`fab5d9f`, run #78) · Call+Request scaffold. Изоляция: org-scoped repos + e2e cross-org — проверено Claude.

## Turnkey: первый пользователь (шаги Founder)
1. **Pre-flight (сам, 5 мин)** на web-URL: Register→Login→создать контакт→заметку→найти поиском→создать компанию с ИНN→найти. Убедиться, что путь не сломан.
2. **Выбрать человека:** один реальный менеджер, кто каждый день звонит/ведёт контакты (напр. MagicMet: Кирилл m2 / Артём m5). Не founder, не разработчик.
3. **Дать ссылку** web-URL + задача: «зарегистрируйся, добавь 3 своих реальных контакта, после звонка добавь заметку, найди контакт поиском».
4. **Смотреть 15 мин** (живой watch-session или скринкаст), молча отмечать, где спотыкается.
5. **3 вопроса:** (1) что было непонятно? (2) нашёл быстрее, чем в Excel/телефоне? (3) пользовался бы каждый день — почему нет?
6. **Записать** ответы в Obsidian `Memory/SAAS/` → Claude обновит DECISIONS/приоритет по фидбеку.

## Prod
web https://web-production-e22e3.up.railway.app · api https://api-production-7f43a.up.railway.app · `/health` ok

BLOCKERS
Founder: имя первого пользователя + watch-session — **после** п.2 merge и п.3 RU UI.

## Примечание (док↔код) — RESOLVED 2026-07-03
Claude подтвердил: связка Contact→Company частично внедрена (schema+migration+e2e+UI), но не закоммичена и не проверена CI → статус UNPROVEN. Решение: изолировать в ветку (см. chore выше), не расширять до фидбека.
