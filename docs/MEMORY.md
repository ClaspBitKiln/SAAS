# MEMORY — снапшот для Claude (Sales OS)

> Обновлять при смене решений Founder. Канон задания: `docs/NEXT.md`. Краткий sync: `docs/CURSOR_SYNC.md`.

**Дата среза:** 2026-07-02

---

## Проект

**AI Sales OS** — call-first B2B CRM для РФ/СНГ (МСБ). Отдельный продукт от inn-bot.

| | |
|---|---|
| GitHub | `ClaspBitKiln/SAAS` |
| **Единственная локальная папка** | `C:\Users\asus\Claude\Projects\SAAS` |
| Obsidian (память, не код) | `C:\Users\asus\Documents\inn-bot\Memory\` (Founder + SAAS) |
| founder-platform | `C:\Users\asus\Claude\Projects\founder-platform` |
| inn-bot (другой продукт) | `C:\Users\asus\CascadeProjects\inn-bot` |

**Правило Founder (D-002):** не держать несколько параллельных копий SAAS. Одна папка + один GitHub. Cursor Cloud — временный клон, не «второй проект».

---

## Роли

| Кто | Зона |
|-----|------|
| **Founder** | WHAT — приоритеты, решения, watch-session |
| **Claude** | память, стратегия, review, `DECISIONS.md`, Obsidian |
| **Cursor** | HOW — код, CI, deploy, evidence |

**Сейчас:** код не трогаем до фидбека первого пользователя (D-001).

---

## Prod (LIVE)

| | URL |
|---|-----|
| Web | https://web-production-e22e3.up.railway.app |
| Register | https://web-production-e22e3.up.railway.app/register |
| API | https://api-production-7f43a.up.railway.app |
| Health | `GET /health` → `{"status":"ok","database":"up"}` |

---

## MVP-ядро — DONE (CI_GREEN)

| Срез | Коммит / run |
|------|----------------|
| Platform (Tenant→Membership) | 2026-07-01 |
| Contact, Call | 2026-07-01–02 |
| Auth + JWT + tenant isolation P0 | `a6f1d89` |
| MVP self-service web | `e9cf69c` |
| Request + E-Metall scaffold | `5e837a8` |
| Railway prod deploy | LIVE 2026-07-02 |
| Contact Notes | `b946126` run #73 |
| Contact Search | `6edbaeb` run #75 |
| **Company CRUD + search** | `fab5d9f` [run #78](https://github.com/ClaspBitKiln/SAAS/actions/runs/28600344202) |

### Company isolation — PASS (Claude + Cursor review)

- Controller: `@CurrentUser` + `requireOrganizationId` на всех routes
- Repository: `findById(id, org)`, `findByInn(inn, org)`, search scoped по `organizationId`
- INN уникален **per-org** (верно для мультитенанта)
- E2E: `company.e2e-spec.ts`, `company-search.e2e-spec.ts`, `tenant-isolation.e2e-spec.ts` (+ companies в ветке `cursor/first-live-user-28ab`)
- Evidence: `docs/EVIDENCE/STEP_2026-07-02_COMPANY_ISOLATION.md`

---

## CURRENT (NEXT.md)

**First live user + feedback** — CONTINUE

### Назначен первый пользователь

| | |
|---|---|
| **Имя** | Илья Юртаев |
| **Компания** | MagicMet |
| **Онбординг** | self-register в **prod** (не localhost demo) |
| **Фидбек-файл** | `docs/EVIDENCE/FEEDBACK_2026-07-02_magicmet-yurtaev.md` |
| **Turnkey** | `docs/first-user/TURNKEY.md` |

**MagicMet demo (localhost):** m1@magicmet.ru — только local, пароли не в git. Prod — отдельная регистрация Ильи.

**Founder делает:** pre-flight smoke → дать ссылку Илье → 15-min watch → заполнить фидбек.

**После фидбека:** Founder выбирает следующий срез (Deal / Contact→Company / AI). Claude переводит в `NEXT.md`.

---

## Решения (DECISIONS.md)

### D-001 — First live user before new aggregates
Не Deal, не Contact→Company до фидбека. MVP-ядро закрыто.

### D-002 — Single project folder
Только `C:\Users\asus\Claude\Projects\SAAS`. Без параллельных клонов.

---

## Backlog (до фидбека)

Deal pipeline · Contact→Company link · AI summary · counterparty-check · RBAC · E-Metall live

---

## Заметки doc↔code

| Тема | Статус |
|------|--------|
| `contact-company-link.e2e-spec.ts` | **Нет в git.** `Contact` в `apps/api` без `companyId`. OUT OF SCOPE в NEXT = верно. Не расширять до решения Founder. |
| `packages/crm/schema.prisma` | spec-схема с `companyId` — будущий дизайн, не prod API |

---

## Ветки / PR

| | |
|---|---|
| `main` | `fab5d9f` (Company feat) |
| `cursor/first-live-user-28ab` | docs: D-001, turnkey, CURSOR_SYNC, isolation e2e, Ilia assignment — [PR #11](https://github.com/ClaspBitKiln/SAAS/pull/11) CI_GREEN |

---

## Read order (новая сессия Claude/Cursor)

1. `docs/MEMORY.md` (этот файл) или `docs/CURSOR_SYNC.md`
2. `docs/NEXT.md`
3. `docs/DECISIONS.md`
4. `docs/BUILD_STATUS.md`
5. `docs/first-user/TURNKEY.md`

---

## Obsidian sync (ручной, на машине Founder)

Скопировать/обновить в `Documents/inn-bot/Memory/SAAS/`:
- решение D-001 + Ilia Yurtaev
- single folder D-002
- prod URLs
- статус: STOP на коде, ждём фидбек

---

## Сообщение Илье (канон)

Регистрация: https://web-production-e22e3.up.railway.app/register (компания MagicMet).

Задачи: 3 контакта · 1–2 компании с ИНН · 2 звонка · заметка · поиск.

Нет: сделки, связь контакт–компания, AI, проверка ИНН.
