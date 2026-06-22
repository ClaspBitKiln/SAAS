# ADR-021 — CI Is The Source Of Truth

**Статус:** Принято (2026-06-21).

## Решение
Локальная машина разработчика — НЕ окончательное доказательство. Истина:
```
GitHub Actions → build → tests → coverage → artifact
```
Статусы прогона:
```
LOCAL_GREEN · CI_GREEN · CI_RED
```
Только **CI_GREEN** даёт право поставить агрегату статус **DONE**.

## Практика
- Пайплайн — `.github/workflows/api.yml`.
- Артефакты: junit-отчёты + coverage публикуются как CI artifacts (доказательство по ADR-020).
- `LOCAL_GREEN` допустим как промежуточный сигнал, но не равен DONE.

## Связанные
ADR-016, ADR-019, ADR-020.
