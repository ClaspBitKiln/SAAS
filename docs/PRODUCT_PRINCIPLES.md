# Product Principles

Filter for **every** product and engineering decision.

| # | Principle |
|---|-----------|
| 1 | **CRM must save time** — if a feature adds admin work, reject it |
| 2 | **Never create extra fields** — minimal data entry, smart defaults |
| 3 | **Automate by default** — manual steps are bugs |
| 4 | **AI first** — AI suggests, human confirms; not the reverse |
| 5 | **Telephony first** — call is the primary event, CRM is context |
| 6 | **Manager speaks, not types** — voice > keyboard |
| 7 | **One click maximum** — common actions in one tap |
| 8 | **No enterprise complexity** — SMB simplicity beats feature parity |
| 9 | **Evidence over opinion** — ship, measure, iterate |
| 10 | **One vertical slice at a time** — working end-to-end beats broad stubs |
| 11 | **Self-filling system** (Founder, 2026-07-04) — данные появляются в CRM сами, по мере работы менеджера; ручной ввод — исключение, а не норма |

## Принцип 11 — конкретные механики (roadmap-привязка)

| Механика | Что заполняется само | Когда |
|----------|----------------------|-------|
| ownerUserId default = создатель | ответственный | CURRENT (в спецификации) |
| Компания по ИНН | название, адрес, ОГРН, статус — из ЕГРЮЛ/DaData (reuse источников inn-bot!) | кандидат next+1 (⚠ новый внешний API — нужно явное «да» Founder, MVP-freeze правило 3) |
| Дубль-детект при вводе телефона/email | подтягивает существующую карточку вместо новой | P2 (docs/102) |
| Звонок → карточка | номер → контакт, звонок в timeline, длительность | телефония |
| Сообщение мессенджера → карточка | контакт, переписка, вложения | Communications |
| Заявка → позиции | парсинг текста заявки в строки (R1) | Request-to-Cash |
| AI summary звонка → заметка | итог разговора без печатания | AI-фаза |

## Decision test

Before building anything, ask:

> Does this move a manager closer to "zero time on CRM admin" after a call?

If **no** → defer. See [FEATURE_MATRIX.md](./FEATURE_MATRIX.md) and [ANTI_GOALS.md](./ANTI_GOALS.md).
