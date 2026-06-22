# ADR-001 — Стек и модульный монолит

**Статус:** Принято (владелец, 2026-06-21)
**Контекст:** AI Sales OS — дешёвый B2B SaaS для РФ/СНГ. Продукт = CRM + Inbox +
телефония + автоматизация + AI. Команда: не-разработчик + ИИ-ассистенты.

## Решение

**Monolith First. NestJS + TypeScript. Modular Monolith. DDD. CQRS. Event-Driven.
Multi-Tenant. Inbox-First. Telephony-First. AI-First. PostgreSQL-First. No Microservices.**

### Стек
| Слой | Технология |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui |
| Backend | NestJS, TypeScript, CQRS, DDD, Event-Driven |
| ORM | Prisma |
| БД | PostgreSQL (+ `pg_trgm` для поиска) |
| Кэш/очереди | Redis + BullMQ |
| События | внутр. шина (NestJS CQRS EventBus) → Kafka/Redpanda на Stage 2 |
| Поиск | PostgreSQL + `pg_trgm` (без Elasticsearch) |
| AI | OpenAI / Claude / Gemini + Qdrant (vector) |
| Телефония | Kamailio + FreeSWITCH + WebRTC + Least Cost Routing |
| Storage | S3-совместимое |
| Тесты | Vitest + Playwright |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki |
| AI-сервис | Python/FastAPI (единственный Python в проекте) |

### Монорепо
```
apps/
  web         # Next.js
  api         # NestJS (модульный монолит)
  worker      # BullMQ воркеры
  scheduler   # cron/расписания
  ai-service  # Python/FastAPI (LLM, RAG, эмбеддинги)
packages/
  auth users rbac
  crm communication telephony tasks calendar
  documents automation ai analytics notifications billing settings
  counterparty-check          # inn-bot как блок
  shared database events       # инфраструктурные пакеты
```

## Почему NestJS, а не Python/FastAPI для всего
Продукт на 80% — это CRM/Inbox/Telephony/Automation/RBAC/Billing/API/WebSocket/Workers,
а не AI. Для этого NestJS+TypeScript целостнее (единый язык фронт/бэк, DI, модули, CQRS,
WebSocket, очереди). Python остаётся только в `apps/ai-service` (LLM/RAG/эмбеддинги).

## Границы (14 bounded contexts)
Auth, Users, CRM, Communication, Telephony, Tasks, Calendar, Documents, Automation,
AI, Analytics, Notifications, Billing, Settings. Плюс блок counterparty-check.
**Не делаем:** HR, Projects, Wiki, CMS, Disk, Company Chat.

## Фазирование (дисциплина «не усложнять без боли»)
Структуру закладываем сразу, тяжёлый runtime — поэтапно:
- **Adopt сразу:** NestJS modular monolith, Prisma, PostgreSQL, Redis+BullMQ, pg_trgm, multi-tenant, REST+WS.
- **Defer (по мере роста/боли):** Kafka/Redpanda (Stage 2), Qdrant (когда появится RAG-функция), полный OTel/Grafana/Loki (на старте — структурные логи + 1 дашборд), собственная ATS на FreeSWITCH (сначала можно SIP-провайдер по API, затем своя LCR).
- **CQRS:** применяем как паттерн команд/запросов, но без обязательного Event Sourcing на старте.

## Последствия
- Один язык (TS) для большей части продукта → проще ИИ-ассистентам генерировать код.
- counterparty-check (Python) общается с системой через API/события, не импортом.
- Миграция inn-bot-логики скоринга в TS — опционально; на старте вызывается как сервис.

## Связанные документы
`001-architecture.md`, `002-blocks-and-sales-stages.md`, `011-crm-domain.md`.
