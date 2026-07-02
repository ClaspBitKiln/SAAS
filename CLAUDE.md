# CLAUDE.md — Sales OS (AI Sales OS)

> **Read first:** [`docs/NEXT.md`](docs/NEXT.md) — do only what it says.  
> **Then:** [`docs/VISION.md`](docs/VISION.md) before every sprint.

> **Shared engineering (canonical):** `C:\Users\asus\Claude\Projects\founder-platform\CLAUDE.md`  
> **Product card:** `founder-platform/products/sales-os.md`

## Product brain (docs/)

| Doc | Purpose |
|-----|---------|
| [NEXT.md](docs/NEXT.md) | **Single source of next action** |
| [VISION.md](docs/VISION.md) | Mission + North Star |
| [PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md) | Decision filter |
| [ANTI_GOALS.md](docs/ANTI_GOALS.md) | Scope guardrails |
| [CUSTOMER_PAIN.md](docs/CUSTOMER_PAIN.md) | Every feature links to pain |
| [FEATURE_MATRIX.md](docs/FEATURE_MATRIX.md) | MVP / V2 / Never |
| [CUSTOMER_JOURNEY.md](docs/CUSTOMER_JOURNEY.md) | Happy path |
| [AI_RULES.md](docs/AI_RULES.md) | AI behavior |
| [TECH_DEBT.md](docs/TECH_DEBT.md) | Debt ledger |
| [METRICS.md](docs/METRICS.md) | What we measure |
| [BUILD_STATUS.md](docs/BUILD_STATUS.md) | CI evidence |
| [directives/FOUNDER_DIRECTIVE.md](docs/directives/FOUNDER_DIRECTIVE.md) | Technical Lead rules |

**Claude must not choose the next module.** Only NEXT.md defines it.

## Что это

**AI Sales OS** — Call-first B2B CRM для РФ/СНГ. **Независимый продукт.**

**inn-bot** — отдельный равноправный продукт (Telegram-бот). Связь только через shared layer и явный REUSE/ADAPT. См. `docs/PROJECTS.md`.

## Архитектура (коротко)
- Стек зафиксирован: **NestJS + TypeScript, модульный монолит, Prisma, PostgreSQL** (см. `docs/038-adr/ADR-001-stack-and-monolith.md`).
- Монорепо: `apps/*` (web, api, worker, scheduler, ai-service) + `packages/*` (контексты + counterparty-check + shared/database/events).
- Контексты общаются только через публичные сервисы/контракты и доменные события, не через прямой импорт внутренних слоёв.
- Каждый контекст: `domain/ application/ infrastructure/ presentation/ tests/`.
- Подробности — `docs/001-architecture.md`.

## Правила инженерии

**Canonical:** `founder-platform/adr/` + `founder-platform/rules/cursor/`

Product overrides ниже + `.cursor/rules/` этого репо.
1. **Не усложнять без боли.** Структуру (modular monolith, CQRS, DDD) закладываем сразу, тяжёлый runtime — поэтапно: Kafka/Redpanda, Qdrant, полный OTel/Grafana/Loki и собственная ATS на FreeSWITCH откладываются до реальной боли (см. фазирование в ADR-001).
2. **Скоринг и бизнес-логика — детерминированные.** LLM — только для текста (объяснения, summary, черновики сообщений), не для решений о риске/деньгах.
3. **MVP-freeze дисциплина.** Не добавлять новые внешние API и источники данных без явного «да» владельца.
4. **При конфликте стратегии и кода — побеждает код.** При конфликте «красивой архитектуры» и простоты — побеждает простота.
5. **Безопасность:** секреты только в переменных окружения, никогда в git и не в чат. Если ключ засветился — ротация.

## Владелец
Проект ведёт **не-разработчик** + ИИ-ассистенты (Cursor — код/деплой, Claude — память/маркетинг/архитектура). Объяснять решения простыми словами, давать готовые команды.

## Этапы продукта (см. docs/002)

MVP-1 ядро CRM → MVP-2 коммуникации → MVP-3 телефония → …
Интеграция с inn-bot (проверка ИНН) — **опционально, позже**, не блокирует Golden Path Platform.

## Запрещено
- Дублировать функциональность Битрикс24 (проекты, склад, HR, диск, wiki, корпчат).
- Менять production **inn-bot** (`C:\Users\asus\CascadeProjects\inn-bot`) при работе над SAAS.
- Смешивать домены: SAAS ≠ inn-bot; reuse только по матрице, не копирование бота в CRM.
- Хардкодить секреты.

## Память

| Артефакт | Путь |
|----------|------|
| **Founder Platform (shared)** | `C:\Users\asus\Claude\Projects\founder-platform` |
| **Obsidian Founder** | `Documents/inn-bot/Memory/Founder/` |
| **Obsidian Sales OS** | `Documents/inn-bot/Memory/SAAS/` |
| **CI доказательства** | `docs/BUILD_STATUS.md`, `docs/KNOWN_FAILURES.md` |
| **inn-bot reference (read-only)** | `docs/reference/inn-bot/` |

## Текущий статус (2026-07-02)

- **Platform + CRM core** = DONE (Tenant … Call, Auth, JWT — CI_GREEN)
- **MVP self-service web** = DONE (`e9cf69c` CI_GREEN)
- **Request MVP + E-Metall scaffold** = DONE (`5e837a8` CI_GREEN)
- **Tenant isolation (P0)** = DONE (`a6f1d89` CI_GREEN) — `@CurrentUser`, org-scoped repos, isolation e2e
- **MagicMet demo tenant** = local only (m1@…m5@magicmet.ru, passwords not in git)
- **LOOP обязателен:** CI = единственная истина; vitest требует SWC + decoratorMetadata для e2e

## Reuse между продуктами

Только по `founder-platform/TRANSFER_RULES.md` (REUSE/ADAPT/REJECT + why).
Матрица: Obsidian `Memory/Founder/02_REUSE_МАТРИЦА.md`.

## Finish What You Start

Всегда доводить начатую задачу до конца (код → тесты → CI или артефакт).
Остановка — **только по явной команде владельца**.

## Language Policy + Safe Edit

- **Чат с владельцем:** русский (если не попросил иное).
- **Код, API, БД, commits:** английский.
- **UI:** не менять язык без явного задания.
- **Перед edit:** прочитать файл, проверить repo/путь/расширение; never docs↔code overwrite.

Canonical: `founder-platform/rules/claude/LANGUAGE_POLICY.md`, `SAFE_EDIT_PROTOCOL.md`
