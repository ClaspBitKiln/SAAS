# [SUPERSEDED → используй docs/AI_CONTEXT.md] AI Sales OS — снимок проекта для внешнего анализа (GPT)

> **Этот файл устарел 2026-07-03.** Канонический внешний briefing — `docs/AI_CONTEXT.md` (обновляется после каждой вехи). Данный снимок оставлен как история.

Дата: 2026-07-03 (вечер). Подготовил Claude (руководящий ИИ проекта). Скопируй этот файл целиком в GPT.
Секретов нет: пароли/токены/DATABASE_URL не включены намеренно.

---

## 1. Что за продукт

**AI Sales OS** — call-first B2B CRM для малого бизнеса РФ/СНГ (1–100 сотрудников), нацелен на металлотрейдинг как первую нишу (боль владельца из собственного бизнеса «Мэджик Металл»). Не клон Битрикс24: только Communications + CRM + Telephony + Automation + AI. Явные анти-цели: никаких проектов, склада, HR, диска, wiki, корпчата.

**Дифференциатор (видение):** автоматизация цикла менеджера «заявка → расценка (с доставкой) → запрос поставщикам → КП/счёт → отправка клиенту» — минуты вместо часов. Пока backlog-дизайн, не в работе.

**Экосистема:** второй продукт inn-bot (Telegram-бот проверки контрагентов по ИНН, в проде, отдельный код) — позже станет блоком counterparty-check внутри Sales OS. Reuse только по явной матрице REUSE/ADAPT/REJECT.

## 2. Команда и процесс (важно для рекомендаций)

- Владелец — **не разработчик**. Вся разработка через ИИ: **Claude руководит** (архитектура, review, приоритеты, задания, память), **Cursor исполняет** (код, тесты, миграции, git, деплой). Claude код не пишет вообще.
- **CI = единственная истина.** Статусы: NOT_RUN / LOCAL_GREEN / CI_GREEN / CI_RED; DONE даёт только CI_GREEN со ссылкой на run. «Заявлено без доказательства = UNPROVEN».
- One Failure At A Time, Evidence-Driven (docs/EVIDENCE/STEP_*.md на каждый шаг), журнал отказов KNOWN_FAILURES (F-001…F-014, все разобраны с RCA).
- Единственный источник следующего действия — docs/NEXT.md. Стратегические решения — docs/DECISIONS.md. Память — Obsidian.
- MVP-freeze: новые модули запрещены до фидбека реальных пользователей.

## 3. Стек (зафиксирован ADR-001)

NestJS + TypeScript, модульный монолит (bounded contexts внутри apps/api/src/modules/*), CQRS-lite (CommandBus/QueryBus, события в EventBus), Prisma + PostgreSQL, Redis/BullMQ (заложено), Next.js 15 + React (apps/web), Vitest (unit/integration/e2e, SWC для декораторов), pnpm monorepo + turbo, GitHub Actions CI, деплой Railway (Docker, api+web+Postgres). Python — только будущий apps/ai-service. Тяжёлый runtime отложен до боли: Kafka/Qdrant/полный OTel/своя ATS — не сейчас. Поиск: PostgreSQL + pg_trgm (без Elasticsearch).

## 4. Что реально сделано (всё CI_GREEN, prod LIVE на Railway)

- **Platform:** Tenant, Organization, User, Membership (мультиарендность: tenant → organizations → memberships).
- **Auth:** Credential + JWT login, Session + refresh, rate-limit 5/min на auth-роуты, Pino structured logging, глобальный JwtAuthGuard.
- **Tenant isolation (P0, F-013):** @CurrentUser + org-scoped репозитории, cross-org e2e — чужие данные недоступны (404).
- **CRM Lite:** Contact CRUD + Notes + Search (?q=), Company CRUD + search + уникальный ИНН per org, **Contact→Company link (смержен сегодня, PR #12, e2e cross-org)**, Call scaffold, Request scaffold (парсинг заявки) + E-Metall scaffold (выключен флагом).
- **Web:** register/login/set-password, dashboard с live-статистикой, страницы contacts/companies/calls/requests/team. UI пока английский — **задание RU-локализации в очереди**.
- **Prod:** web https://web-production-e22e3.up.railway.app · api https://api-production-7f43a.up.railway.app · /health ok. В проде 1 реальный tenant (Мэджик Металл, аккаунт владельца, 3 реальных контакта). 44 тест-файла. ~80 CI-прогонов.

## 5. Сегодняшние события (2026-07-03)

1. Git hygiene: вся память docs/** закоммичена; WIP изолирован в ветку; .env.local в .gitignore.
2. Prod cleanup: смок-аккаунты удалены из прода с SQL-evidence.
3. **Первое реальное использование (владелец):** 3 реальных контакта (1 РФ + 2 Узбекистан). Находки: (а) нет поля компании у контакта → разморозили ветку, review, PR #12, merge; (б) переговоры идут в Telegram (через VPN) и MAX → Communications проектировать Telegram+MAX first; (в) рынок РФ+СНГ, не только РФ; (г) менеджеры сидят с личных телефонов → приватность: синхронизировать только явно привязанные чаты; (д) UI должен быть русским.
4. F-014: локальные e2e били в прод-БД (прод-URL в .env) — исправлено, прод просканирован и чист.

## 6. Очередь работ (NEXT.md)

1. ✅ Prod cleanup. 2. ✅ Contact→Company link merged (ожидает prod smoke). 3. ⏳ RU UI (статичные русские строки, без i18n-фреймворка). Затем: **первый живой пользователь** — реальный менеджер (не владелец) проходит Register→Contact→Note→Search, watch-session 15 мин, 3 вопроса. Только после его фидбека — новые модули.

Roadmap после фидбека (порядок не финален): Deal pipeline → Communications (Telegram+MAX inbox) → Request-to-Cash автоматизация (R1 парсинг → R2 детерминированная расценка → R3 КП PDF → R4 отправка email) → телефония → AI-агенты. Принципы: деньги считает не LLM (только детерминированные формулы); human-in-the-loop на отправке; каждый слайс ценен отдельно.

## 7. Технический долг (осознанный)

- TD-006 (P1): прод применяет схему через `prisma db push` при старте контейнера, миграции в репо неполные (baseline без requests/notes) — консолидировать, перейти на `migrate deploy`.
- TD-001: User+Identity один агрегат. TD-002: нет slug у Organization. TD-005: события без outbox. TD-004: мёртвый scaffold packages/* (21 пустой пакет от ранней архитектуры) и пустые модули в apps/api — вычистить.
- Битые мелочи: docs 001-architecture местами описывает packages/* как место кода, а код в apps/api/src/modules (док надо привести к коду).

## 8. Бизнес-состояние

MRR 0. Пользователей 0 (кроме владельца). Ниша: металлотрейдинг РФ/СНГ. Первый кандидат-пользователь: менеджер компании владельца (MagicMet). Модель: дешёвый SaaS-подписка (тарифы не зафиксированы). Конкуренты: Битрикс24/amoCRM (перегружены, дорогие для микробизнеса, нет автоматизации расценки металла).

## 9. Вопросы к GPT (по ним жду анализ)

1. **Приоритет после RU UI + фидбека менеджера:** Deal pipeline vs Communications (Telegram+MAX) vs Request-to-Cash (расценка+КП)? Что быстрее приведёт к первому платящему клиенту-металлотрейдеру?
2. **Telegram-интеграция в РФ-реалиях** (Telegram официально через VPN): какие юридически/технически устойчивые варианты подключения аккаунтов менеджеров (MTProto user-session vs Bot API vs шлюзы)? Риски блокировок?
3. **MAX (мессенджер):** есть ли публичное API для бизнес-интеграций и что реально доступно?
4. **Приватность личных чатов** менеджеров: как лучшие продукты (Kommo, Wazzup, Pact и т.п.) решают «личный телефон = личная переписка», какие паттерны consent/фильтрации?
5. **Расценка металлопроката:** типовые источники цен поставщиков (E-Metall, 23met, прайсы Excel) — как продукты автоматизируют ingest прайсов? OCR/парсинг Excel/API?
6. **Узбекистан:** что учесть для СНГ-экспансии (валюты, реквизиты, аналог ИНН — СТИР, локальные мессенджеры)?
7. **Критика архитектуры/процесса:** видишь ли риски в модели «не-разработчик + Claude руководит + Cursor исполняет + CI истина»? Что сломается первым при росте?
8. **Ценообразование** для микро-B2B РФ: с чего стартовать (за место? за tenant? freemium?) при цели «первые 10 платящих»?

## 10. Ссылки (если нужен код)

GitHub: https://github.com/ClaspBitKiln/SAAS (main `e135e41`). Структура: apps/{api,web} рабочие; ключевые модули apps/api/src/modules/{platform,auth,contacts,companies,calls,requests}. Каждый модуль: domain/application/infrastructure/presentation/tests.
