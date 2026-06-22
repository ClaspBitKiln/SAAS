# 011 — CRM Bounded Context (детальное проектирование)

Контекст `packages/crm`. Стек по ADR-001 (NestJS + Prisma + PostgreSQL, CQRS, DDD,
multi-tenant). Это ядро AI Sales OS.

## 1. Подмодули
Companies · Contacts · Deals · Pipelines/Stages · Activities · Notes · Tags ·
Products/DealProducts · CustomFields · Timeline · Search.

## 2. Aggregates и сущности

### 2.1 Company (aggregate root)
Поля: `id, tenantId, name, inn, kpp, website, industry, employeesCount, address,
description, ownerUserId, createdAt, updatedAt, deletedAt`.
Методы: `rename(name)`, `changeOwner(userId)`, `archive()`, `restore()`,
`addTag(tagId)`, `removeTag(tagId)`, `setCustomField(key,value)`, `attachInn(inn)`.
Инварианты: `name` непустое; `inn` валиден (10/12 цифр) если задан; внутри `tenantId` `inn` уникален (если задан).

### 2.2 Contact (aggregate root)
Поля: `id, tenantId, companyId?, name, position, phone, email, telegram, maxId,
createdAt, updatedAt, deletedAt`.
Методы: `changePhone()`, `changeEmail()`, `linkCompany(companyId)`, `archive()`, `restore()`, `merge(otherId)`.
Инварианты: хотя бы один канал связи (phone/email/telegram) при создании желателен; формат email/phone валиден.

### 2.3 Deal (aggregate root)
Поля: `id, tenantId, companyId?, contactId?, pipelineId, stageId, title, amount,
currency, probability, status(OPEN|WON|LOST), expectedCloseDate, ownerUserId,
lostReason?, createdAt, updatedAt, closedAt?`.
Методы: `moveStage(stageId)`, `closeWon()`, `closeLost(reason)`, `changeAmount(amount,currency)`,
`assignOwner(userId)`, `addProduct(productId,qty,price)`, `removeProduct(...)`.
Инварианты: `amount >= 0`; `probability 0..100`; `stageId` принадлежит `pipelineId`;
после `closeWon/closeLost` запрещены изменения, кроме reopen; смена стадии меняет `probability` по умолчанию из Stage.

### 2.4 Pipeline (aggregate root) + Stage (entity)
Pipeline: `id, tenantId, name, isDefault, createdAt, updatedAt`.
Stage: `id, pipelineId, name, position, probability, color, isWon, isLost`.
Методы Pipeline: `addStage()`, `reorderStages()`, `renameStage()`, `setDefault()`.
Инвариант: ровно один `isDefault` pipeline на tenant; позиции стадий уникальны и непрерывны.

### 2.5 Activity (entity, часть Timeline)
Поля: `id, tenantId, type(CALL|MESSAGE|EMAIL|MEETING|NOTE|TASK), companyId?, contactId?,
dealId?, payloadJson, occurredAt, createdByUserId, createdAt`.
Назначение: единый поток событий для Timeline (см. §6).

### 2.6 Note, Tag, Product, CustomField
- Note: `id, tenantId, entityType, entityId, body, createdByUserId, createdAt`.
- Tag: `id, tenantId, name, color`; M:N с Company/Contact/Deal.
- Product: `id, tenantId, name, sku, price, currency, description`.
- DealProduct: `dealId, productId, quantity, price`.
- CustomFieldDef: `id, tenantId, entityType, key, label, type(TEXT|NUMBER|BOOLEAN|DATE|SELECT|MULTISELECT), options[]`.
- CustomFieldValue: `id, tenantId, defId, entityType, entityId, value(jsonb)`.

## 3. Value Objects
`Inn` (10/12 цифр + контрольная), `Money{amount,currency}`, `Email`, `Phone`(E.164),
`Probability`(0..100), `StageRef{pipelineId,stageId}`, `TenantId`, `Color`(hex).
VO неизменяемы и валидируют себя в конструкторе.

## 4. Domain Events
`CompanyCreated, CompanyUpdated, CompanyArchived, CompanyOwnerChanged,
ContactCreated, ContactUpdated, ContactMerged,
DealCreated, DealUpdated, DealStageChanged, DealWon, DealLost, DealOwnerChanged,
ActivityRecorded, NoteAdded, TagAttached, TagDetached`.
Payload каждого: `{ tenantId, aggregateId, ...changes, occurredAt, version }`.
Консьюمеры: Timeline (проекция), Automation (триггеры), Analytics (метрики),
AI (Forecast/Follow-up), Notifications.

## 5. CQRS

### Commands (write)
`CreateCompany, UpdateCompany, ArchiveCompany, RestoreCompany, ChangeCompanyOwner, MergeCompany,
CreateContact, UpdateContact, MergeContact, ImportContacts,
CreateDeal, UpdateDeal, MoveDeal, CloseDealWon, CloseDealLost, AssignDeal, AddDealProduct, RemoveDealProduct,
CreatePipeline, AddStage, ReorderStages,
AddNote, AttachTag, DetachTag, SetCustomFieldValue`.
Каждая команда → CommandHandler → загрузка агрегата → метод домена → сохранение → публикация событий.

### Queries (read)
`GetCompany, SearchCompanies, ListCompanies,
GetContact, SearchContacts, ListContactsByCompany,
GetDeal, ListDeals(filter), GetPipeline, GetPipelineBoard(дealи по стадиям),
GetCompanyTimeline, ForecastDeals`.
Read-модели могут читать денормализованные проекции (Timeline, board) напрямую.

### Handlers
- CommandHandlers: транзакция Prisma, оптимистическая блокировка по `updatedAt`/`version`.
- EventHandlers: проекции Timeline, реакция Automation/Analytics.
- QueryHandlers: только чтение, без побочных эффектов.

## 6. Timeline
Денормализованная проекция всех событий по компании/контакту/сделке.
Таблица `timeline_events(id, tenantId, entityType, entityId, kind, title, payloadJson, occurredAt)`.
Заполняется EventHandlers из ActivityRecorded и доменных событий. Карточка компании
показывает единый поток: сообщения, звонки, встречи, заметки, задачи, документы,
AI-summary, изменения сделки, **результат проверки контрагента** (из counterparty-check).

## 7. REST API (presentation)
```
GET    /companies            ListCompanies (filter, page)
POST   /companies            CreateCompany
GET    /companies/{id}       GetCompany
PATCH  /companies/{id}       UpdateCompany
DELETE /companies/{id}       ArchiveCompany
POST   /companies/{id}/restore
GET    /companies/{id}/timeline   GetCompanyTimeline

GET    /contacts             ListContacts/Search
POST   /contacts             CreateContact
GET    /contacts/{id}        GetContact
PATCH  /contacts/{id}        UpdateContact
DELETE /contacts/{id}        ArchiveContact
POST   /contacts/import      ImportContacts

GET    /deals                ListDeals(filter)
POST   /deals                CreateDeal
GET    /deals/{id}           GetDeal
PATCH  /deals/{id}           UpdateDeal
POST   /deals/{id}/move      MoveDeal {stageId}
POST   /deals/{id}/won       CloseDealWon
POST   /deals/{id}/lost      CloseDealLost {reason}

GET    /pipelines            ListPipelines
POST   /pipelines            CreatePipeline
GET    /pipelines/{id}/board GetPipelineBoard

GET    /search?q=            глобальный поиск (company/contact/deal/phone/email/inn)
```
Каждая ручка: summary, request, validation (class-validator), response DTO, errors, permissions (RBAC).
OpenAPI генерируется из NestJS-декораторов (`@nestjs/swagger`).

## 8. WebSocket события (realtime для UI)
`deal.created, deal.updated, deal.stage.changed, deal.won, deal.lost,
company.updated, contact.updated, timeline.appended`.
Каналы по tenant: `tenant:{tenantId}` + по сущности `deal:{id}`.

## 9. Поиск (<100 мс)
GIN + `pg_trgm` индексы: `company(name, inn)`, `contact(name, phone, email)`,
`deal(title)`. Глобальный `/search` объединяет результаты через UNION с ранжированием
по `similarity()`. Текст сообщений ищется в контексте communication (отдельно).

## 10. Тесты
- **Unit:** value objects (Inn, Money, Phone), методы агрегатов (moveStage, closeWon инварианты), доменные сервисы.
- **Integration:** репозитории (Prisma + тест-БД), command/query handlers, изоляция по `tenantId`.
- **E2E (Playwright):** критические потоки — создать компанию → авто-проверка контрагента → создать сделку → провести по воронке → WON.
- Контракт-тесты OpenAPI.

## 11. Интеграция с counterparty-check
При `CompanyCreated` с валидным `inn` → событие подхватывает counterparty-check →
возвращает `{score, traffic, арбитраж, ФССП, статус}` → `ActivityRecorded(type=NOTE,
kind=counterparty_check)` → попадает в Timeline и в блок «Counterparty» карточки.
Подробнее: `010-block-counterparty-check.md`.
