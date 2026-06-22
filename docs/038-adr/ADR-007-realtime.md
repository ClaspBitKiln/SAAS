# ADR-007 — Realtime

**Статус:** Принято (2026-06-21). Детализирует ADR-003 §3.

## Решение
- NestJS Gateway + **Socket.IO** + **Redis adapter** (масштабирование по инстансам).
- Rooms: `tenant:{id}`, `user:{id}`, `conversation:{id}`, `deal:{id}`.
- События: `message.received, conversation.updated, deal.updated, task.created`.
- Авторизация сокета по JWT; вступление в room только после проверки доступа к ресурсу.

## Связанные
ADR-003, ADR-006.
