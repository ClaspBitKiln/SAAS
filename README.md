# AI Sales OS

Простая, надёжная и быстрая система для B2B-продаж в России и СНГ.
Ядро — **CRM**, вокруг которого собраны коммуникации, телефония, автоматизация и AI.

> Это **отдельный продукт**, в который inn-bot (проверка контрагента) входит как **один из блоков** — `counterparty-check`. Существующий Telegram-бот @INNRussia_bot продолжает работать на Railway без изменений; сюда его код **скопирован** как снимок, а не перенесён.

---

## Принцип

Не «ещё один Битрикс24». Только то, что нужно менеджеру по продажам:

```
Communications + CRM + Telephony + Automation + AI + Counterparty Check
```

Никаких задач на всю компанию, проектов, склада, HR, диска, wiki и корпоративного чата.

---

## Блоки системы

| Блок | Папка | Назначение | Статус |
|------|-------|-----------|--------|
| Platform Core | `blocks/platform-core` | Auth, Users, RBAC, Tenants, общая шина | spec |
| CRM | `blocks/crm` | Компании, контакты, сделки, воронка, таймлайн | spec |
| Communications | `blocks/communications` | Единый Inbox: Telegram, WhatsApp, MAX, Email | spec |
| Pipeline | `blocks/pipeline` | Этапы продаж, конверсия, прогноз | spec |
| Telephony | `blocks/telephony` | SIP/WebRTC, записи, транскрипция | spec |
| Tasks | `blocks/tasks` | Задачи менеджера | spec |
| Calendar | `blocks/calendar` | Встречи, напоминания | spec |
| Documents | `blocks/documents` | КП, счета, договоры, PDF | spec |
| Automation | `blocks/automation` | Триггеры → действия | spec |
| AI | `blocks/ai` | Агенты внутри карточек (SDR, Call, Follow-up, Proposal, Forecast) | spec |
| Analytics | `blocks/analytics` | Метрики менеджера и руководителя | spec |
| **Counterparty Check** | `blocks/counterparty-check` | **Проверка контрагента по ИНН (inn-bot)** | **рабочий код** |

---

## Документация

- `docs/000-vision.md` — что строим и для кого
- `docs/001-architecture.md` — архитектура, стек, монорепо
- `docs/002-blocks-and-sales-stages.md` — блоки, привязанные к этапам продажи
- `docs/010-block-counterparty-check.md` — как inn-bot встраивается как блок
- `docs/reference/inn-bot/` — скопированная база знаний и стратегия inn-bot
- `CLAUDE.md` — правила для Claude Code и Cursor

---

## Источник

inn-bot скопирован из (production-источник, не трогать на деплое):
- Код / git: `C:\Users\asus\CascadeProjects\inn-bot`
- Память / Obsidian: `C:\Users\asus\Documents\inn-bot`
