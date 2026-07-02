# Collab loop — Claude ↔ Cursor (Sales OS)

Автоматический цикл без ручного «отчитайся» от владельца.

## Роли

| Кто | Делает |
|-----|--------|
| **Claude** | Приоритеты, `docs/CURSOR_TASK_*.md`, обновляет `docs/collab/TO_CURSOR.md` |
| **Cursor** | Код, CI, deploy, пишет `docs/collab/TO_CLAUDE.md`, обновляет `BUILD_STATUS.md` |
| **Владелец** | Браузерный smoke, решения продукта, «да/нет» на scope |

## Цикл (автомат)

```
1. Cursor читает docs/NEXT.md + docs/collab/TO_CURSOR.md (или docs/CURSOR_TASK_*.md)
2. Cursor → код → commit → push → CI_GREEN → redeploy (если prod)
3. Cursor пишет docs/collab/TO_CLAUDE.md (STATUS / Evidence / DONE / ASK)
4. Cursor ставит docs/NEXT.md → CURRENT: STOP, BLOCKERS: ждём Claude
5. Claude читает TO_CLAUDE → память Obsidian → пишет TO_CURSOR + CURSOR_TASK + NEXT.md
6. Владелец говорит Cursor «далее» ИЛИ Cursor подхватывает при CURRENT: CONTINUE
```

## Файлы

| Файл | Направление | Когда обновлять |
|------|-------------|-----------------|
| `docs/collab/TO_CLAUDE.md` | Cursor → Claude | После каждого CI_GREEN slice |
| `docs/collab/TO_CURSOR.md` | Claude → Cursor | Новое задание |
| `docs/CURSOR_TASK_*.md` | Claude → Cursor | Детальное ТЗ на этап |
| `docs/NEXT.md` | Claude/Cursor | Единый указатель «что сейчас» |
| `docs/BUILD_STATUS.md` | Cursor | Доказательства CI/prod |

## STOP

После `TO_CLAUDE.md` Cursor **не** начинает Phase 3 / новый модуль без `TO_CURSOR.md` или `CURRENT: CONTINUE` в NEXT.md.
