# Deploy на Railway (Sales OS MVP)

> Платформа: **Railway** (решение владельца 2026-07-02).  
> Предусловие: tenant isolation = CI_GREEN (`a6f1d89`).

## Архитектура (3 сервиса)

| Сервис | Dockerfile | Порт | Health |
|--------|------------|------|--------|
| **postgres** | Railway plugin | 5432 | — |
| **api** | `apps/api/Dockerfile` | `$PORT` (3000) | `GET /health` |
| **web** | `apps/web/Dockerfile` | `$PORT` (3001) | — |

Репозиторий: https://github.com/ClaspBitKiln/SAAS

---

## 1. Railway project

```powershell
npm i -g @railway/cli
railway login
cd C:\Users\asus\Claude\Projects\SAAS
railway init
```

Или через UI: [railway.app](https://railway.app) → New Project → Deploy from GitHub → `ClaspBitKiln/SAAS`.

---

## 2. PostgreSQL

1. В проекте: **+ New** → **Database** → **PostgreSQL**
2. Скопировать `DATABASE_URL` из Variables сервиса Postgres

---

## 3. Сервис API

1. **+ New** → **GitHub Repo** → SAAS (или **Empty Service** + Dockerfile)
2. Settings:
   - **Root Directory:** `/` (корень монорепо)
   - **Config file:** `apps/api/railway.json`
   - **Dockerfile path:** `apps/api/Dockerfile`
3. **Variables** (обязательные):

| Variable | Значение |
|----------|----------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (reference) |
| `JWT_SECRET` | сгенерировать: `openssl rand -base64 32` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL web-сервиса (после деплоя web) |
| `EMETALL_ENABLED` | `false` |

Опционально: `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `EMETALL_*`.

4. Deploy → дождаться **ACTIVE**
5. Smoke: `curl https://<api-host>/health` → `{"status":"ok","database":"up"}`

При первом старте контейнер выполняет `prisma db push` (схема из `schema.prisma`).

---

## 4. Сервис Web

1. **+ New** → тот же репозиторий
2. Settings:
   - **Config file:** `apps/web/railway.json`
   - **Dockerfile path:** `apps/web/Dockerfile`
3. **Variables / Build args:**

| Variable | Значение |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | `https://<api-host>` (публичный URL API) |
| `PORT` | Railway выставит автоматически |

`NEXT_PUBLIC_API_URL` нужен **на этапе build** Docker-образа.

4. Deploy → открыть публичный URL web

---

## 5. Связать CORS

После появления URL web, обновить в API:

```
CORS_ORIGIN=https://<web-host>
```

Redeploy API.

---

## 6. Smoke test (happy path)

1. `https://<web>/register` — регистрация
2. Login → Dashboard
3. Contacts → создать контакт
4. Calls → залогировать звонок
5. Requests → parse + create

---

## 7. MagicMet (опционально)

Локальный demo tenant **не** переносится автоматически. Для prod: register через UI или отдельный seed (не в git).

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| API health 503 / crash | Проверить `DATABASE_URL`, логи deploy |
| Web «Network error» | `NEXT_PUBLIC_API_URL` при build + CORS на API |
| 401 на CRM | JWT / login flow; не путать с tenant isolation |
| E-Metall | `EMETALL_ENABLED=false` до live-ключей (STEP 2) |

---

## Секреты

Никогда в git и чат. Только Railway Variables. Если `JWT_SECRET` засветился — ротация + re-login всех пользователей.
