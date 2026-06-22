# ADR-026 — Golden Path

**Статус:** Принято (2026-06-21).

## Решение
Каждый агрегат проходит ОДИН И ТОТ ЖЕ pipeline, без исключений:
```
Entity → VO → Repository interface → Prisma → Repository impl →
Commands → Queries → Handlers → Controller → DTO → Swagger →
Unit → Integration → E2E → CI_GREEN → DONE
```

## Практика
- Tenant — эталон (reference implementation) этого пути.
- Каждый следующий агрегат копирует структуру Tenant и проходит те же стадии и тот же Release Gate (ADR-025).
- Отклонение от Golden Path требует отдельного ADR.

## Связанные
ADR-010, ADR-015, ADR-025.
