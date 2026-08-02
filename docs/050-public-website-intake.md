# 050 — Публичный приём заявок с сайта

## Назначение

Сайт `www.magicmet.ru` является первым публичным этапом SaaS-воронки. Браузер отправляет форму только в серверный `LeadGateway` сайта. Gateway передаёт проверенную заявку в SaaS, где создаётся или находится контакт и сохраняется новая заявка в модуле `requests`.

SaaS остаётся единственной CRM. Сайт не хранит стадии сделки.

## Рабочий контракт

```text
Browser
  → POST /api/leads на www.magicmet.ru
  → Netlify LeadGateway
  → POST /integrations/site/v1/leads в SaaS
```

Обязательные заголовки server-to-server запроса:

- `Authorization: Bearer <SITE_INGEST_TOKEN>`;
- `Idempotency-Key: <externalLeadId>`;
- `X-Tenant-Id: <PUBLIC_INTAKE_ORGANIZATION_ID>`;
- `Content-Type: application/json`.

Токен на стороне сайта хранится как `SAAS_SITE_INGEST_TOKEN`, а на стороне SaaS — как `SITE_INGEST_TOKEN`. Значения должны совпадать. Токен никогда не передаётся браузеру.

Endpoints SaaS:

- `POST /integrations/site/v1/leads` — принять заявку сайта;
- `POST /integrations/site/v1/events` — принять событие анонимной воронки через серверный адаптер.

Оба endpoint помечены `@Public()` только в смысле отсутствия пользовательского JWT. Доступ защищён отдельным Bearer-токеном интеграции, tenant-заголовком, rate limit и дополнительной проверкой `Origin`, когда он присутствует.

## Идемпотентность

Сайт передаёт одинаковое значение в:

- поле `externalLeadId`;
- заголовок `Idempotency-Key`.

Заголовок обязателен. Повторный запрос возвращает уже созданный `requestId` и `duplicate: true`. До отдельной таблицы интеграций стабильный внешний ID хранится в служебной отметке заявки:

```text
[website-lead:<externalLeadId>]
```

## Ответ SaaS

Успешный ответ имеет HTTP 202 и содержит:

```json
{
  "ok": true,
  "requestId": "<uuid>",
  "companyId": null,
  "contactId": "<uuid>",
  "status": "DRAFT",
  "externalLeadId": "<external id>",
  "duplicate": false
}
```

Gateway преобразует этот ответ в безопасный ответ браузеру. Секреты и внутренние ошибки SaaS наружу не передаются.

## Что попадает в SaaS

1. Контакт создаётся по имени и значению поля «телефон или e-mail» либо используется существующий контакт с тем же значением.
2. Создаётся `Request` со статусом `DRAFT` и источником `PASTED`.
3. Текст потребности сохраняется как строка заявки.
4. Полный JSON сайта — версия схемы, UTM, referrer, sessionId, выбранные товарные группы и недавние события — сохраняется в `sourceText` для проверки менеджером.
5. Краткий контекст источника сохраняется в `notes`.

## Переменные окружения

SaaS:

```env
CORS_ORIGINS=http://localhost:3001,http://localhost:4173,https://www.magicmet.ru,https://magicmet.ru
SITE_INGEST_TOKEN=<длинный случайный секрет>
PUBLIC_INTAKE_ORGANIZATION_ID=<UUID организации Мэджик Металл>
PUBLIC_INTAKE_ORGANIZATION_INN=7453362080
PUBLIC_INTAKE_ALLOWED_ORIGINS=https://www.magicmet.ru,https://magicmet.ru,http://localhost:4173
```

Сайт:

```env
SAAS_API_URL=<HTTPS URL SaaS>
SAAS_SITE_INGEST_TOKEN=<то же значение, что SITE_INGEST_TOKEN>
SAAS_TENANT_ID=<то же значение, что PUBLIC_INTAKE_ORGANIZATION_ID>
SAAS_SOURCE_ID=magicmet-website
```

В production необходимо задать стабильный UUID организации. Поиск по ИНН оставлен только как резерв для локального запуска.

## Ограничения запуска

- production не изменяется этим кодом;
- до проверки интеграционного теста реальные обращения не отправлять;
- адрес уведомлений проекта: `m1@magicmet.ru`;
- единственный офис компании: Челябинск;
- дизайн сайта и PR сайта не сливать без отдельного визуального утверждения.

## Следующее усиление

После проверки первой рабочей связки выделить таблицы `external_leads` и `funnel_events` с уникальным ключом `(organization_id, source_system, external_lead_id)`. Это даст транзакционную идемпотентность и отдельную аналитику событий без зависимости от логов.
