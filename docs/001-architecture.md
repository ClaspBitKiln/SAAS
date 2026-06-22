# 001 — Архитектура

Решение по стеку зафиксировано в `038-adr/ADR-001-stack-and-monolith.md`.
**Monolith First · NestJS + TypeScript · Modular Monolith · DDD · CQRS · Event-Driven ·
Multi-Tenant · PostgreSQL-First · No Microservices.**

## Стек
| Слой | Технология |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, shadcn/ui |
| Backend | NestJS, TypeScript, CQRS, DDD, Event-Driven |
| ORM | Prisma |
| БД | PostgreSQL + `pg_trgm` (поиск без Elasticsearch) |
| Кэш/очереди | Redis + BullMQ |
| События | NestJS CQRS EventBus (внутр.) → Kafka/Redpanda на Stage 2 |
| AI | OpenAI / Claude / Gemini, vector — Qdrant (Stage 2) |
| Телефония | Kamailio + FreeSWITCH + WebRTC + Least Cost Routing |
| Storage | S3-совместимое |
| Тесты | Vitest (unit/integration) + Playwright (e2e) |
| Observability | OpenTelemetry + Prometheus + Grafana + Loki |
| AI-сервис | Python/FastAPI (единственный Python в проекте) |

## Монорепо
```
SAAS/
  apps/
    web         # Next.js (UI)
    api         # NestJS — модульный монолит (все контексты как модули)
    worker      # BullMQ воркеры (тяжёлые/фоновые задачи)
    scheduler   # cron / расписания
    ai-service  # Python/FastAPI — LLM, RAG, эмбеддинги
  packages/
    auth/ users/ rbac/
    crm/ communication/ telephony/ tasks/ calendar/
    documents/ automation/ ai/ analytics/ notifications/ billing/ settings/
    counterparty-check/          # inn-bot как блок (Python, через API/события)
    shared/ database/ events/     # инфраструктурные пакеты
  docs/  .cursor/rules/  CLAUDE.md
```
> Модульный монолит: `apps/api` подключает контексты из `packages/*` как NestJS-модули.
> Контексты общаются через **публичные сервисы/контракты и доменные события**, а не через
> прямой импорт внутренних слоёв друг друга.

## Структура одного контекста (DDD)
```
packages/<context>/
  domain/
    entities/         # агрегаты и сущности
    value-objects/    # value objects
    events/           # доменные события
    repositories/     # интерфейсы репозиториев
    services/         # доменные сервисы
  application/
    commands/         # команды (write)
    queries/          # запросы (read)
    handlers/         # command/query/event handlers
    dto/              # input/output DTO
  infrastructure/
    prisma/           # схема и реализации репозиториев
    ...               # внешние адаптеры (API, очереди)
  presentation/
    controllers/      # REST + WS
  tests/              # unit + integration
```

## Мультиарендность
- Единая БД, у всех основных таблиц — `tenant_id` (+ составные индексы `(tenant_id, …)`).
- Изоляция арендатора на уровне репозиториев (обязательный фильтр `tenant_id`).
- Per-schema / per-DB — только если появится регуляторная/нагрузочная необходимость.

## Поиск
PostgreSQL + `pg_trgm` (GIN-индексы по name/phone/email/inn/текст сообщений).
Цель: <100 мс. Elasticsearch — отложено до реальной боли.

## События
NestJS CQRS `EventBus` внутри монолита. Внешняя шина (Kafka/Redpanda) — Stage 2.
Каждое событие: Producer, Consumers, Payload, Version, Retry policy (документируется в `packages/*/domain/events`).

## Gates (фазирование, см. ADR-001)
- Adopt сразу: NestJS+Prisma+Postgres+Redis/BullMQ+pg_trgm+multi-tenant+REST/WS.
- Defer: Kafka/Redpanda, Qdrant, полный OTel/Grafana/Loki, собственная ATS на FreeSWITCH.
- Не вводить тяжёлую инфраструктуру без доказанной боли.
