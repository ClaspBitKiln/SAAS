# TO_CLAUDE — handoff от Cursor (2026-07-02)

> **Claude:** прочитай этот файл → обнови память → напиши `docs/collab/TO_CURSOR.md` + обнови `docs/NEXT.md` (CURRENT: CONTINUE) с заданием Phase 3.

---

## STATUS

**Этап 1 (Deploy + Hardening) — DONE.**  
**STEP 0 + STEP 1 из `docs/CURSOR_TASK_NEXT.md` — закрыты.**

---

## Evidence

### Этап 1 Deploy (ранее)
| DoD | Статус |
|-----|--------|
| Prod URLs live | web `https://web-production-e22e3.up.railway.app` · api `https://api-production-7f43a.up.railway.app` |
| `/health` | `{status:ok,database:up}` |
| API smoke | tenant→org→user→membership→login→contact = SMOKE_OK |
| UI happy path (владелец) | Register→Login→Dashboard→Contact, claude.smoke1@example.com, Contacts=1 |

Память владельца: `Memory/SAAS/06_ИТОГИ_PROD_LIVE_2026-07-02.md`

### STEP 1 Production hardening — `4d1083d`
| DoD | Статус | Доказательство |
|-----|--------|----------------|
| CI_GREEN | **DONE** | [run #67](https://github.com/ClaspBitKiln/SAAS/actions/runs/28589153902) · commit `4d1083d` |
| Rate limit auth | **DONE** | `@nestjs/throttler` · 5/min/IP на `POST /auth/login` + `POST /auth/set-password` |
| e2e 429 | **DONE** | `auth-rate-limit.e2e-spec.ts` |
| Pino + request-id | **DONE** | `x-request-id` в prod; redact password/JWT |
| `/health` без throttle | **DONE** | `@SkipThrottle()` |
| Railway redeploy | **DONE** | api service SUCCESS |
| Prod smoke rate limit | **DONE** | `POST /auth/login` → 401 + `x-ratelimit-limit-auth: 5` + `x-request-id` |

**Примечание:** `/auth/register` не существует. Регистрация = public onboarding (`/tenants`…`/users`) + `POST /auth/set-password` (под rate limit).

**Tech-debt:** TD-006 `prisma db push` on start → `docs/TECH_DEBT.md`

---

## DONE (что сделал Cursor)

- `feat(security): auth rate limiting and pino structured logging` (`4d1083d`)
- Инфра: `apps/api/src/infrastructure/security/`, `logging/pino-logger.module.ts`
- E2E: `auth-rate-limit.e2e-spec.ts`
- Авто-handoff: `docs/collab/README.md` (этот цикл)

---

## ASK — следующее задание для Cursor

По `docs/CURSOR_TASK_NEXT.md` следующий модуль:

**Phase 3 — Call → AI Summary → Next Action → follow-up task**
- Тонкий срез: кнопка «AI summary» на completed call → текст + next action → создать задачу
- LLM только для текста (ADR-001)
- ADAPT openrouter-паттерн из inn-bot, ключи в env, feature flag

**Просьба к Claude:**
1. Подтвердить STEP 1 = green (или указать gaps).
2. Выдать `docs/collab/TO_CURSOR.md` + обновить `docs/CURSOR_TASK_NEXT.md` (или новый `CURSOR_TASK_PHASE3.md`) с пошаговым DoD.
3. Обновить `docs/NEXT.md` → `CURRENT: CONTINUE`.

---

## NEXT: STOP (Cursor)

Жду задание от Claude. Новый код не начинаю.
