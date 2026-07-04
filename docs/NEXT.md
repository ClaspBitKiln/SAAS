# NEXT — единственный источник истины

Читают: Cursor (исполнение) + Claude (руководство). Доказательства → `docs/EVIDENCE/`. Стратегия → `docs/DECISIONS.md`.

---

CURRENT
**Компания по ИНН (self-filling, принцип №11):** менеджер вводит ИНН → название/адрес/ОГРН/статус подтягиваются из ЕГРЮЛ автоматически. Внешний API одобрен Founder («да», 2026-07-04).

**Код написан Claude (2026-07-04), ждёт push Founder** (`C:\Users\asus\Claude\Projects\SAAS\push-feature.bat`).
Дизайн: провайдер **DaData findById/party** (10k/сутки бесплатно; Checko-ключ засвечен, API-ФНС всего 800 req). Ключ ТОЛЬКО в env `DADATA_API_KEY` (сервер), graceful `configured:false` без ключа → CI без сети. Endpoint `GET /companies/inn-lookup/:inn` (JWT, формат ИНН 400, сбой сети 502). Web: кнопка «Заполнить по ИНН» в форме компании → name автозаполняется, инфо-строка ОГРН/статус/адрес. Тесты: unit `inn-lookup.mapper.spec.ts` (маппинг DaData) + e2e `company-inn-lookup.e2e-spec.ts` (configured:false · 400 · 401). HTTP через node:https (без новых зависимостей).
**После CI_GREEN — шаг Founder:** зарегистрироваться на dadata.ru (бесплатно) → скопировать API-ключ → Railway, сервис `api` → Variables → `DADATA_API_KEY` → redeploy.

ПОСЛЕ: Tasks P1 (тип/дедлайн/экран «Сегодня», docs/102) → дубли-предупреждение P2 → Deal pipeline P2.
Параллельная веха Founder: первый менеджер + фидбек — остаётся, не блокирует.

STATUS (предыдущий шаг)
✅ **Ответственный менеджер — DONE** (CI_GREEN 2026-07-04, run #91, `293763e`; evidence `STEP_2026-07-04_OWNER_USER.md`). Railway redeploy авто; проверка прода — ниже.

Объём изменений (Claude, файловые правки, локальный прогон невозможен — песочница без VM):
- API: schema.prisma (+ownerUserId на Company/Contact + индексы) · миграция `20260704120000_owner_user` · entities (+assign через updateDetails) · commands (+ownerUserId, +currentUserId) · handlers (+resolveOwnerUserId: ACTIVE membership в org, иначе 'Owner not found'; default = создатель) · DTOs (+@IsUUID optional; response +ownerUserId) · controllers (+404 mapping) · repositories · modules (+MembershipsModule)
- e2e: `company-owner.e2e-spec.ts` (default=creator · assign коллеге · cross-org 404 · unset null) · `contact-owner.e2e-spec.ts`
- Web: `use-org-members.ts` (hook: ACTIVE участники) · contacts/companies: select «Ответственный», отображение в списках · ru.ts (+owner/noOwner/ownerShort)
- Проверено статически: все callsites `create()`/`rehydrate()` совместимы (grep), паттерн 1:1 с PR #12.

## Спецификация: ответственный менеджер

Паттерн полностью повторяет Contact→Company link (PR #12):
1. **Prisma:** `ownerUserId String? @db.Uuid` + index — на Company И Contact. Миграция по образцу `20260702150000`.
2. **Domain:** поле + `assignOwner()` в обеих entity; событие `*.owner.changed`.
3. **Валидация (org-scope!):** ownerUserId должен иметь Membership в организации (аналог `resolveCompanyId` → `membershipRepo.findByUserAndOrganization`); чужой/несуществующий → 404 'Owner not found'.
4. **Default:** при создании ownerUserId = текущий пользователь (из JWT), если не передан.
5. **DTO:** create/update `@IsUUID @IsOptional ownerUserId`; `null` снимает; response включает ownerUserId.
6. **Web:** в формах Company/Contact select «Ответственный» (список membership'ов org — endpoint team уже есть); default текущий; колонка в списках.
7. **e2e:** default=creator · назначение члену org · cross-org user → 404 · unset null.
DoD: CI_GREEN · prod smoke · BUILD_STATUS/EVIDENCE · отчёт.

ПОСЛЕ этой фичи (порядок из docs/102): Tasks P1 (тип/дедлайн/«Сегодня») → дубли-предупреждение P2 → Deal pipeline P2.

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

✅ **MERGED 2026-07-03 (Founder, добро Claude):** PR #12 → main `e135e41`, 2 checks passed, ветка удалена.

✅ **Prod smoke (2026-07-03):** Railway redeploy OK — `/health`, OpenAPI `companyId`, contacts JS bundle. Evidence `STEP_2026-07-03_CONTACT_COMPANY_PROD.md`.

### 3. RU UI — **DONE** (CI_GREEN 2026-07-03, `ddda7b8` + `9037517`, run #89)
Локализовать web UI на русский: меню (Dashboard→Панель, Contacts→Контакты, Companies→Компании, Calls→Звонки, Requests→Заявки, Team→Команда), формы register/login/set-password, страницы контактов/компаний/заявок, кнопки/плейсхолдеры/ошибки валидации.
Просто и без боли: без i18n-фреймворка — статичные русские строки (или один `ru.ts` словарь). EN не сохранять. Код/API/БД остаются английскими.
DoD: в UI нет видимых английских строк на happy path · web-build CI_GREEN · redeploy · скриншот-проверка Founder.

✅ **Независимая проверка Claude (2026-07-03):** prod `/login` отдаёт русский UI («Войдите в рабочее пространство», «Пароль», «Войти») — redeploy подтверждён снаружи. Флейк run #88 зафиксирован как F-015 (KNOWN_FAILURES, RCA при рецидиве).

Очередь Cursor пуста — все 3 задания DONE. **Примечание 2026-07-03: у Cursor исчерпаны токены** — не блокирует: активный шаг за Founder, кода в очереди нет.

**Активный шаг (Founder, без кода):** скриншот-проверка RU UI в prod (login → контакты → форма с select компании) → отправить приглашение менеджеру (Кирилл m2 / Артём m5) → watch-session → фидбек в Obsidian `Memory/SAAS/07_ФИДБЕК_ПЕРВЫЙ_ПОЛЬЗОВАТЕЛЬ.md`.

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
Founder: скриншот-проверка RU UI + приглашение менеджера — **после** CI_GREEN RU UI push.

## Примечание (док↔код) — RESOLVED 2026-07-03
Claude подтвердил: связка Contact→Company частично внедрена (schema+migration+e2e+UI), но не закоммичена и не проверена CI → статус UNPROVEN. Решение: изолировать в ветку (см. chore выше), не расширять до фидбека.
