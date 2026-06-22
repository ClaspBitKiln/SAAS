# 002 — Блоки и этапы продажи

Продукт спроектирован вокруг **жизненного цикла продажи**, а не вокруг технических модулей.

## 8 этапов продажи
```
1. Получение лида
2. Первый контакт
3. Квалификация (BANT)
4. Встреча
5. КП (коммерческое предложение)
6. Переговоры
7. Оплата
8. Удержание клиента
```

## Какой блок работает на каждом этапе

| Этап | Основные блоки | Что происходит |
|------|----------------|----------------|
| 1. Лид | Communications, CRM, AI | Создаются Conversation, Company, Contact, Deal. AI Summary, Lead Score. **Counterparty-check**: авто-проверка ИНН компании-лида, риск в карточке. |
| 2. Первый контакт | Communications, Telephony, CRM | Звонок/сообщение/email → Activity, Timeline, запись, транскрипт. |
| 3. Квалификация | CRM, AI | BANT. AI: Qualified / Warm / Cold / Spam. |
| 4. Встреча | Calendar, Tasks, AI | Meeting, напоминание. После — Summary, Next Action. |
| 5. КП | Documents, AI | Proposal Agent генерирует КП/PDF. |
| 6. Переговоры | CRM, AI | Объекции, конкуренты, скидки, вероятность. |
| 7. Оплата | Pipeline, CRM, Documents | Сделка → WON, счёт, клиент. **Counterparty-check**: финальная проверка перед договором. |
| 8. Удержание | CRM, Automation, AI | Follow-up Agent возвращает «забытых» клиентов. |

## Воронка по умолчанию
```
NEW → CONTACT → QUALIFICATION → MEETING → PROPOSAL → NEGOTIATION → PAYMENT → WON / LOST
```
Пользователь может создавать свои воронки и этапы.

## Где встроен counterparty-check (inn-bot)
Проверка контрагента — не отдельный сервис, а функция внутри CRM:
- На этапе **Лид** — авто-проверка по ИНН при создании компании.
- В **карточке компании** — блок «Риск контрагента»: арбитраж, ФССП, статус ЕГРЮЛ, скоринг 0–100, светофор.
- Перед **Оплатой/Договором** — «должная осмотрительность» (54.1), PDF-досье как артефакт с датой.

> Порядок РЕАЛИЗАЦИИ контекстов зафиксирован в `038-adr/ADR-002-mvp-dependency-order.md`:
> Platform Core → Auth → Users → RBAC → CRM → Communication(Inbox) → … Список ниже —
> карта возможностей по этапам продаж, а не порядок сборки.

## Roadmap (MVP по блокам)
```
MVP-1  Platform Core + CRM (компании, контакты, сделки, воронка, поиск)
MVP-2  Communications (Telegram, Email, Inbox)
MVP-3  Telephony (WebRTC/SIP, записи, транскрипция)
MVP-4  Tasks + Calendar
MVP-5  Automation
MVP-6  AI-агенты
MVP-7  Documents / КП
MVP-8  Analytics
[уже есть]  Counterparty-check — подключается к CRM как блок начиная с MVP-1
```
