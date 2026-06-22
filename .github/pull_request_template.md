# PR

## Что и зачем
<!-- кратко: какой агрегат/срез, какая стадия Golden Path (ADR-026) -->

## Чеклист Release Gate (ADR-025) — заполняется по CI, не вручную (ADR-024)
- [ ] build = GREEN
- [ ] unit = GREEN
- [ ] integration = GREEN
- [ ] e2e = GREEN
- [ ] coverage ≥ threshold
- [ ] swagger boots

## Доказательства (ADR-023 — artifact or it didn't happen)
<!-- ссылка на CI run + artifacts (test-reports, coverage). Без них — UNPROVEN. -->
- CI run: <ссылка>
- Artifacts: test-reports / coverage

## Правила
- [ ] Не нарушает Architecture Freeze (ADR-015) и Module Dependency Rules (ADR-011)
- [ ] Не начинает новый агрегат, пока предыдущий ≠ DONE (ADR-016/022)
- [ ] Conventional Commit в заголовке (feat/fix/refactor/test/docs/chore)
