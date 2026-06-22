# 010 — Блок Counterparty Check (inn-bot)

## Что это
Проверка контрагента по ИНН: арбитраж (kad.arbitr), долги ФССП, статус ЕГРЮЛ,
оценка рисков, скоринг 0–100 со светофором GREEN/YELLOW/RED. Источник — Telegram-бот
@INNRussia_bot, который продолжает работать на Railway.

## Где код
- `blocks/counterparty-check/src/` — снимок product-кода (FastAPI + aiogram + скоринг).
- `blocks/counterparty-check/tests/` — тесты (offline + emulator).
- Живой источник (не трогать): `C:\Users\asus\CascadeProjects\inn-bot`.

## Текущий стек блока
Python 3.12, FastAPI (web/API), aiogram 3 (бот), SQLite на Railway Volume.
Источники данных (каскад): Checko API (арбитраж + ФССП) → kad-прокси на VPS →
DataNewton → ЕФРСБ → DaData. Скоринг — `risk_scoring.py` (детерминированный).

## Как встраивается в AI Sales OS
Блок отдаёт CRM единый результат проверки контрагента:

```
CRM.Company (есть ИНН)
   → событие CompanyCreated / запрос «проверить контрагента»
   → counterparty-check.run_counterparty_check(inn)
   → возвращает: { score, traffic(GREEN/YELLOW/RED), арбитраж, ФССП, статус ЕГРЮЛ, риски }
   → CRM показывает блок «Риск контрагента» в карточке компании
   → событие CounterpartyChecked → Timeline + Automation
```

### Точки интеграции
1. **Авто-проверка лида** — при создании Company с ИНН.
2. **Карточка компании** — блок «Риск контрагента» (скоринг, арбитраж, ФССП).
3. **Перед сделкой WON/договором** — должная осмотрительность (54.1), PDF-досье с датой.
4. **Мониторинг** (позже) — алерт в CRM при изменении риска по контрагенту.

## Что НЕ менять при интеграции
- Скоринг остаётся детерминированным.
- Не добавлять новые источники данных без «да» владельца (MVP-freeze inn-bot).
- LLM (Groq) — только для текста PDF/объяснений, выключен по умолчанию.

## База знаний
Стратегия, архитектура и память inn-bot скопированы в `docs/reference/inn-bot/`.
Ключевые: `strategy/16_AI_ARCHITECTURE_MAP.md`, `strategy/17_GPT_STRATEGY_TEMPLATE_CRITICAL.md`,
`memory/Мастер_развития.md`, `memory/ПРОЕКТ_ДЛЯ_АНАЛИЗА_GPT.md`.
