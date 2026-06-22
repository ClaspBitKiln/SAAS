# ADR-013 — Testing Pyramid

**Статус:** Принято (2026-06-21).

## Уровни
- **Unit:** Entities, Value Objects, Use Cases (домен — без БД и сети).
- **Integration:** Repositories, Prisma (тест-БД), Controllers; проверка RLS-изоляции tenant.
- **E2E (Playwright):** критические бизнес-потоки.

## Приоритеты покрытия
```
1. Auth   2. RBAC   3. CRM   4. Inbox   5. Telephony   6. Automation
```

## Правила
- No snapshot tests.
- Не тестировать приватные методы.
- Тестировать поведение, а не реализацию.
- Тесты пишутся в шаге 12 generation order (после контрактов), но до «готово».

## Связанные
ADR-010, ADR-003 (RLS-тесты).
