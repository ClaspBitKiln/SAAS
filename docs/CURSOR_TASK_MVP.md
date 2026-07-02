# Задание Cursor — довести MVP до рабочего и безопасного состояния

> Составлено по review кода (2026-07-02). Источник истины — CI (ADR-021).
> Правила: LOOP (CI = истина) · One Failure At A Time · MVP-freeze · Reuse-матрица (Obsidian `Memory/SAAS/02_REUSE_МАТРИЦА`).
> **Не трогать `vitest.config.ts`** — SWC-фикс уже сделан (F-012 RESOLVED). Секреты только в env.

---

## Definition of Done «рабочего MVP»

Happy path проходит end-to-end и **безопасен для >1 тенанта**:
Register → Invite → Login → Contacts CRUD → Log calls → Request (parse manual/file) → (E-Metall dark) — и **ни один пользователь не видит чужой тенант**.

---

## STEP 0 — Push & Prove (baseline, без нового кода)

```
cd C:\Users\asus\Claude\Projects\SAAS
git push origin main      # commit 53d6890
```
- Дождаться workflow `api` → **CI_GREEN** (jobs `build-test` + `web-build`).
- Если RED → чинить ТОЛЬКО первый упавший шаг, записать `F-0XX` в `docs/KNOWN_FAILURES.md`.
- Обновить `docs/BUILD_STATUS.md`: Request MVP → CI_GREEN. **Не помечать DONE до зелёного.**

---

## STEP 1 — P0 SECURITY: tenant isolation (блокирует настоящий MVP)

### Доказательство (evidence)
- `requests/presentation/controllers/request.controller.ts:90` — `list()` берёт `organizationId` из `@Query` (доверие клиенту).
- `request.controller.ts:100-104` — `GET /:id` без tenant-проверки.
- `requests/application/handlers/request.query-handlers.ts:13` — `findById(query.id)` без tenant.
- `requests/infrastructure/prisma-request.repository.ts:18` — `where: { id, deletedAt: null }` (нет `organizationId`).
- **Тот же дефект:** `contacts/infrastructure/prisma-contact.repository.ts:13`, `calls/infrastructure/prisma-call.repository.ts:14`.
- Контекст доступен: `auth/infrastructure/access-token.service.ts:6-11` (payload с `tenantId`/`organizationId`), `jwt-auth.guard.ts:31` (`request.user`).

### Root cause
Нет проброса tenant-контекста из JWT в команды/запросы; репозитории не скоупят по tenant; контроллеры доверяют `organizationId` от клиента. Это IDOR / OWASP A01. Чиним **систему, а не один запрос**.

### Fix
1. **`@CurrentUser()`** param-decorator (`auth/infrastructure`) → возвращает `AccessTokenPayload` из `request.user`. Reuse во всех контроллерах.
2. Контроллеры **Request / Contact / Call**: `organizationId`/`tenantId` брать ТОЛЬКО из `req.user`. Удалить доверие к `@Query('organizationId')` и `dto.organizationId` для скоупинга. Если `organizationId == null` → `403 Forbidden`.
3. Read-методы репозиториев (`findById`, `listBy*`) принимают `organizationId` (и/или `tenantId`) и фильтруют: `where: { id, organizationId, deletedAt: null }`. Команды/queries несут этот контекст.
4. Применить ко **всем трём** агрегатам — один класс дефекта.
5. **e2e-регрессия:** пользователь тенанта A → `404` на `:id` тенанта B; подстановка чужого `organizationId` игнорируется/`403`; листинг возвращает только свой org.
6. `docs/KNOWN_FAILURES.md`: `F-0XX` (Broken Access Control / tenant scope) + Preventive action: read-методы обязаны принимать tenant scope (ADR/линт).

**DoD:** CI_GREEN + новые e2e-тесты доказывают изоляцию.

---

## STEP 2 — P1 Platform hardening (только когда появятся live E-Metall ключи)

По Reuse-матрице (P0/P1/P4), adapt из inn-bot `RESILIENT_ARCHITECTURE` / `openrouter_client` retry-chain — **не изобретать**:
- `@nestjs/config` ConfigModule + валидация env (заменить прямой `process.env` в `e-metall.config.ts`).
- HTTP client: timeout (`AbortController`) + retry/backoff вместо голого `fetch` (`e-metall-api.client.ts`).
- Логирование ошибок (Pino) + correlation-id вместо `catch {}`.
- Webhook (`e-metall.controller.ts:65`): HMAC по телу + **запрет при пустом секрете** (сейчас проверка пропускается).
- Exception filter + `/health` (Terminus).

**DoD:** CI_GREEN; E-Metall остаётся `enabled=false`, пока не готово.

---

## STEP 3 — Deploy (follow-up, нужно решение владельца)

MVP «рабочий» = доступен клиенту. Сейчас SAAS без production deploy. Кандидат — Railway (как inn-bot). **Не начинать до STEP 1 = CI_GREEN.** Требует решения по платформе + managed Postgres + env/secrets.

---

## Guardrails
- Каждый шаг = отдельный коммит + CI_GREEN + запись в `BUILD_STATUS.md`. **Never continue on red.**
- Без новых внешних API/источников без явного «да» владельца (MVP-freeze).
- Не трогать `vitest.config.ts` (F-012 done).

## Решение (принято 2026-07-02): Вариант A — безопасный мультитенантный MVP
STEP 1 (tenant isolation) — **обязательный следующий шаг после STEP 0**, до любого deploy/онбординга.
Обоснование: MVP = SaaS на >1 клиента; с broken access control релиз невозможен. Фикс дешёвый (контекст уже в JWT). Вариант «быстрый одно-тенантный пилот» отклонён как создающий долг-утечку, который всё равно закрывать до клиента №2.

Порядок исполнения: **STEP 0 → STEP 1 → (STEP 2 при live-ключах) → STEP 3 deploy.**
