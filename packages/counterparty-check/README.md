# Block: Counterparty Check (inn-bot)

Проверка контрагента по ИНН как блок AI Sales OS. Подробное описание интеграции —
`../../docs/010-block-counterparty-check.md`.

## Что уже скопировано сюда
- `risk_scoring.py` — **ядро скоринга** (детерминированная модель риска 0–100, светофор GREEN/YELLOW/RED). Скопировано дословно.
- `requirements.txt`, `Procfile`, `railway.json` — деплой-конфиг.

## Как получить полный код (точная копия)
Сетевой доступ к GitHub из этой среды закрыт, а большой монолит `simple_app.py`
(~2300 строк) безопаснее копировать локально, чем перепечатывать. Поэтому:

```
# из этой папки на машине владельца:
powershell -ExecutionPolicy Bypass -File sync_from_innbot.ps1
#   или двойной клик по sync_from_innbot.bat
```

Скрипт скопирует из production-источников (только чтение, ничего не ломая):
- код: `C:\Users\asus\CascadeProjects\inn-bot` → сюда (`simple_app.py`, `storage.py`,
  `checko_client.py`, `moex_client.py`, `pdf_dossier.py`, `source_catalog.py`,
  `automation.py`, тесты);
- знания: `C:\Users\asus\Documents\inn-bot\Memory` и `…\CascadeProjects\inn-bot\CLAUDE_MEMORY`
  → `../../docs/reference/inn-bot/`.

## Важно
- Живой бот @INNRussia_bot деплоится на Railway из `CascadeProjects\inn-bot`. Этот
  блок — **снимок**, не трогает production.
- Скоринг остаётся детерминированным. LLM — только для текста (PDF/объяснения).
- Секреты (`.env`, `Учётные_данные.md`) не копируются и не коммитятся.

## Известная проблема
В папке остался каталог `_gitsnapshot/` от неудачного `git clone` — среда не смогла
его удалить (ограничения монтирования). Удалите его вручную:
`rmdir /s /q _gitsnapshot` (Windows).
