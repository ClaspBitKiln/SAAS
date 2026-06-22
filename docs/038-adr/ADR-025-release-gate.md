# ADR-025 — Release Gate

**Статус:** Принято (2026-06-21).

## Решение
Переход `IMPLEMENTED → DONE` возможен ТОЛЬКО при одновременном выполнении:
```
build       = GREEN
unit        = GREEN
integration = GREEN
e2e         = GREEN
coverage    ≥ threshold
swagger     boots
```
Все проверки — в CI (ADR-021), с артефактами (ADR-023).

## Порог coverage (стартовый)
threshold = **70%** по `domain/` + `application/` нового агрегата (поднимать со временем, не снижать — ADR-017).

## Практика
Gate проверяется одним CI job; merge в `main` блокируется при невыполнении (branch protection).

## Связанные
ADR-016, ADR-021, ADR-024.
