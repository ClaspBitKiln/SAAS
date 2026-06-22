# Reference: inn-bot knowledge base

База знаний проекта inn-bot, перенесённая в AI Sales OS как контекст для блока
counterparty-check.

## Сейчас здесь
- `strategy/RELEASE_PLAN.md` — план релизов + правило MVP-freeze (включая «SaaS-кабинет — позже»).
- `memory/ПРОЕКТ_ДЛЯ_АНАЛИЗА_GPT.md` — полное описание проекта для передачи в GPT.

## Остальное — через sync-скрипт
Полную базу (все файлы `Memory/` и `CLAUDE_MEMORY/`) копирует локально:
`../../../blocks/counterparty-check/sync_from_innbot.ps1`

Ключевые файлы, которые он принесёт:
- `strategy/15_STRATEGY_MASTER_TEMPLATE.md` — стратегия (блоки 1–68).
- `strategy/16_AI_ARCHITECTURE_MAP.md` — архитектура vision vs реальность.
- `strategy/17_GPT_STRATEGY_TEMPLATE_CRITICAL.md` — фильтр ADOPT/DEFER/REJECT для идей GPT.
- `memory/Мастер_развития.md`, `memory/Архитектура_и_история.md`, `memory/Задачи_и_статус.md`.

## Секреты
`Учётные_данные.md` и `.env` НЕ копируются и НЕ коммитятся.
