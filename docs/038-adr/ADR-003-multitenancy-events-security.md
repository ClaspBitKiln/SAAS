# ADR-003 — Multi-tenancy, События, Безопасность

**Статус:** Принято (владелец, 2026-06-21)
**Контекст:** Кросс-cutting решения для всех контекстов (для SaaS 1–100 сотрудников).

## 1. Мультиарендность — ADOPT
- **Single database**, `tenant_id` в каждой таблице.
- **PostgreSQL Row Level Security (RLS)** — политика по `tenant_id` на всех таблицах
  с арендными данными. Приложение выставляет `SET app.current_tenant` в начале запроса;
  RLS — второй рубеж к фильтру в репозиториях.
- **НЕ** database-per-tenant и **НЕ** schema-per-tenant (избыточно на нашем масштабе).
- `tenantId` берётся из JWT-claim → guard/interceptor → Prisma middleware (+ RLS GUC).
  Фоновые задачи BullMQ несут `tenantId` в payload и тоже выставляют контекст.

## 2. События — ADOPT (без Kafka до Stage 5)
- **Transactional Outbox + BullMQ.** В одной транзакции с изменением агрегата пишем
  строку в `event_outbox`. Worker читает `status=PENDING`, публикует во внутреннюю
  шину (NestJS EventBus) / ставит в BullMQ, помечает `PUBLISHED`.
- Гарантии: at-least-once; консьюмеры **идемпотентны** (по `aggregate_id`+`version` или `event_id`).
- Базовые события: `deal.created, deal.stage.changed, conversation.created,
  message.received, task.created`.
- Таблица `event_outbox(id, event_name, aggregate_type, aggregate_id, payload jsonb,
  status, created_at, published_at)`.
- Kafka/Redpanda — только Stage 5+ при реальной нагрузке.

## 3. Realtime — ADOPT
- **NestJS Gateway + Socket.IO + Redis-adapter** (масштабирование по инстансам).
- Каналы по tenant: `tenant:{id}`; события `message.received, conversation.updated,
  deal.updated, task.created`.

## 4. Auth / Сессии — ADOPT
- JWT **access 15 мин**, **refresh 30 дней**. Сессии/refresh — в **Redis**
  (отзыв, выход со всех устройств). Ротация refresh при использовании.
- Пароли — **Argon2id**.

## 5. RBAC — ADOPT (минимальная модель)
Роли: Owner (всё), Admin (всё кроме billing), Manager (свои сделки/коммуникации),
Viewer (read-only). Модель прав — матрица **Resource × Action**
(пример Deals: read, create, update, delete, assign). Видимость «только свои» для
Manager — на уровне репозитория (фильтр по `ownerUserId`).

## 6. Аудит — ADOPT
`audit_logs(tenant_id, user_id, entity_type, entity_id, action, old_data jsonb,
new_data jsonb, created_at)`. Логировать: кто, когда, что, до, после.

## 7. 152-ФЗ / безопасность данных — ADOPT
- Шифрование данных **AES-256** (at rest), транспорт **TLS 1.3**.
- PII: телефон, email, записи звонков — помечать и ограничивать доступ.
- Локализация ПДн в РФ влияет на выбор хостинга (см. вопрос в `099`/`100`).

## Связанные
`ADR-001` (стек), `ADR-002` (порядок), `012-foundation-domains.md`, `011-crm-domain.md`.
