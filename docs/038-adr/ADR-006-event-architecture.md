# ADR-006 — Event Architecture

**Статус:** Принято (2026-06-21). Детализирует ADR-003 §2.

## Решение
Поток событий без Kafka:
```
Domain Events → Outbox Table → BullMQ → Internal Subscribers
```
- Доменное событие пишется в `event_outbox` в одной транзакции с изменением агрегата.
- Worker забирает PENDING → публикует в BullMQ → внутренние подписчики обрабатывают.
- Подписчики **идемпотентны** (по `event_id`/`aggregate_id`+`version`).
- Kafka/Redpanda — только Stage 5+.

## Связанные
ADR-003, ADR-004.
