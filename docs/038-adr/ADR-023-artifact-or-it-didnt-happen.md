# ADR-023 — Artifact Or It Didn't Happen

**Статус:** Принято (2026-06-21). Усиливает ADR-020.

## Решение
Утверждение «tests passed / coverage generated / swagger works» обязано сопровождаться
артефактом: report · log · coverage · build artifact. Иначе статус = **UNPROVEN**.

## Практика
- CI публикует junit + coverage как artifacts (`.github/workflows/api.yml`).
- Ссылка на конкретный CI-run/artifact — единственное допустимое доказательство.
- «Я проверил локально» без приложенного вывода = UNPROVEN.

## Связанные
ADR-019, ADR-020, ADR-021.
