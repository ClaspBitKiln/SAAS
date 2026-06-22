# BOOTSTRAP — довести Tenant до green (ADR-016)

Порядок: workspace → tsconfig → nest → vitest → docker → prisma → compile → unit → integration → e2e.

## 0. Требования
Node 20+, pnpm 9+, Docker.

## 1. Установка
```bash
pnpm install
cp .env.example .env
```

## 2. Поднять БД (Postgres + Redis)
```bash
pnpm db:up        # docker compose up -d postgres redis
```

## 3. Prisma
```bash
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate --name init_tenant   # создаст таблицу tenants
```

## 4. Компиляция
```bash
pnpm build        # tsc -p tsconfig.json  → должно компилироваться
```

## 5. Тесты
```bash
pnpm test              # unit (БД не нужна) — должны быть зелёные
pnpm test:integration  # нужен поднятый Postgres + migrate
pnpm test:e2e          # поднимает Nest-приложение + supertest
```

## 6. Запуск API
```bash
pnpm --filter @ai-sales-os/api dev
# Swagger: http://localhost:3000/docs
# POST http://localhost:3000/tenants  { "name": "Acme", "slug": "acme" }
```

## Definition of Done (ADR-016) для Tenant
- [ ] `pnpm build` без ошибок
- [ ] unit green
- [ ] integration green (Postgres)
- [ ] e2e green
- [ ] Swagger стартует, `POST /tenants` работает

Только после всех галочек Tenant = DONE → можно начинать **Organization**.

## Примечание про RLS и outbox
- RLS-политики (ADR-003/005) добавляются миграцией для арендных таблиц; для Tenant
  (платформенный корень) RLS не требуется.
- Доменные события Tenant пока через NestJS EventBus; маршрутизация через `event_outbox`
  (ADR-006) — отдельный срез `events/outbox`, который идёт раньше бизнес-контекстов.
