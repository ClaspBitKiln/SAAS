# Authorization Model — Identity, User, Membership, Role, Permission

**Статус:** Draft v2 (2026-06-16) — **утвердить до написания кода**  
**Контекст:** Platform + Users + RBAC · дополняет `012-foundation-domains.md`, ADR-003  
**Уже реализовано (CI_GREEN):** Tenant, Organization

---

## 1. Зачем этот документ

User/Identity — начало системы безопасности. Ошибка здесь (например `User.roleId`)
через полгода потребует миграции всей RBAC.

**Правило:** зафиксировать модель целиком → кодировать агрегаты по одному с CI_GREEN.

---

## 2. ASCII-диаграмма связей

```
Tenant
   │
   ├──────────────┐
   │              │
Organization      Role
   │              │
   └──────┐       │
          │       │
      Membership──┘
          │
          │
         User
          │
    (будущий split)
          │
       Identity   ← email, password, OAuth, MFA
```

**Цепочка доступа:**

```
Request → JWT (userId) → Membership → Role → RolePermission → Permission
```

**Membership — сердце модели.** User не знает Role. Organization не знает User.

---

## 3. Identity vs User

| Сущность | Ответственность |
|----------|-----------------|
| **Identity** | email, passwordHash, OAuth, MFA, refresh tokens |
| **User** | name, avatarUrl, locale, timezone, status |

```
Identity (1) ──→ (1) User ──→ (N) Membership
```

**MVP:** один агрегат User в **`UsersModule`**; Credential в `packages/auth`.
Split Identity/User — позже, через ADR, без смены Membership.

**На User запрещено:** `roleId`, `tenantId`, `organizationId`, массив permissions.

---

## 4. Сущности

### Tenant *(✅ CI_GREEN)*

id, name, slug, plan, status, version, timestamps, deletedAt.

---

### Organization *(✅ CI_GREEN, migration: slug)*

| Поле | Назначение |
|------|------------|
| id, tenantId | PK, scope |
| name | название |
| **slug** | unique per tenant (`alfa-corp`) — для URL и invite |
| inn, settings | реквизиты, настройки |
| version, timestamps, deletedAt | ADR-012 |

Organization **не знает** User.

---

### User *(UsersModule — первый агрегат после утверждения)*

| Поле | Назначение |
|------|------------|
| id | UUID |
| email | unique **global** |
| name | имя |
| avatarUrl | nullable |
| locale | default `ru-RU` |
| timezone | default `Europe/Moscow` |
| status | INVITED \| ACTIVE \| DISABLED |
| lastLoginAt | Auth |
| version, timestamps, deletedAt | ADR-012 |

---

### Membership *(сердце RBAC — второй агрегат)*

| Поле | Назначение |
|------|------------|
| id | PK |
| tenantId | RLS |
| userId | → User |
| organizationId | → Organization |
| roleId | → Role **в этой org** |
| status | PENDING \| ACTIVE \| SUSPENDED \| REVOKED |
| **invitedBy** | userId пригласившего |
| invitedAt | когда отправлено |
| **joinedAt** | принял приглашение |
| **leftAt** | уволен / вышел |
| **isDefault** | org по умолчанию после login |
| version, timestamps, deletedAt | ADR-012 |

**Unique:** `@@unique([userId, organizationId])`

**Методы:** `invite()`, `accept()`, `suspend()`, `revoke()`, `changeRole()`, `setDefault()`.

---

### Role *(tenant scope)*

| Поле | Назначение |
|------|------------|
| id, tenantId | PK, scope |
| key | OWNER \| ADMIN \| MANAGER \| VIEWER \| custom |
| name | отображаемое имя |
| isSystem | системные не удалять |
| version, timestamps, deletedAt | ADR-012 |

**Не хранит:** userId, массив Permission.

---

### Permission

| Поле | Назначение |
|------|------------|
| id | PK |
| **code** | стабильный ключ для UI и guards |
| resource | `crm.contact`, `crm.call`, … |
| action | `read`, `write`, `delete`, … |
| description | человекочитаемо |

**Примеры code:**

```
crm.contact.read
crm.contact.write
crm.contact.delete
crm.call.listen
crm.task.close
billing.manage
```

**Unique:** `@@unique([code])` или `@@unique([resource, action])`

---

### RolePermission *(отдельная таблица, не массив в Role)*

```
Role (1) ──→ (N) RolePermission (N) ──→ (1) Permission
```

| Поле | Назначение |
|------|------------|
| id | PK |
| roleId | → Role |
| permissionId | → Permission |
| grantedAt | когда назначено |

**Unique:** `@@unique([roleId, permissionId])`

---

### AuditEvent *(интерфейс с первого дня — реализация после Permission)*

| Поле | Назначение |
|------|------------|
| id | PK |
| tenantId | RLS |
| **actorId** | userId |
| **organizationId** | контекст org |
| **entity** | `Contact`, `Deal`, `Membership`, … |
| **entityId** | UUID сущности |
| **action** | `created`, `updated`, `deleted`, `invited`, … |
| **payload** | jsonb (old/new snapshot) |
| createdAt | |

**Интерфейс в коде:** `AuditLogger.log(event)` — stub до полной реализации.

---

## 5. Platform Super Admin *(вне Membership)*

| Сущность | Назначение |
|----------|------------|
| **PlatformAdmin** | userId + scope PLATFORM, не привязан к Organization |

Доступ ко всем Tenant для support/onboarding. **Не** через Membership Owner.

---

## 6. Пять сценариев (проверка модели)

### Сценарий 1 — один user, одна org, одна role

```
User U1 → Membership M1 (Org A, MANAGER, ACTIVE)
```

JWT + `X-Organization-Id: A` → MANAGER permissions. ✅

### Сценарий 2 — один user, две org, две role

```
U1 → M1 (Org A, MANAGER)
U1 → M2 (Org B, ADMIN)
```

Переключение org в UI → другой Membership → другие permissions. ✅ Без `User.roleId`.

### Сценарий 3 — увольнение

```
Membership M1: ACTIVE → REVOKED, leftAt = now
User U1: остаётся ACTIVE (может быть в других org)
```

Login работает; доступ к Org A закрыт. ✅

### Сценарий 4 — удаление Organization

```
Organization A: soft delete (deletedAt)
→ все Membership где organizationId=A: REVOKED или cascade soft delete
User U1: остаётся
```

✅ User не удаляется.

### Сценарий 5 — суперадминистратор платформы

```
PlatformAdmin(U1) — не Membership
→ доступ к Tenant management API
→ не Owner в клиентской org
```

✅ Отдельная сущность, не ломает RBAC клиентов.

---

## 7. Порядок реализации (Golden Path)

После **утверждения** документа:

```
1. User              (UsersModule)
2. Membership
3. Role              (+ seed OWNER/ADMIN/MANAGER/VIEWER per tenant)
4. Permission        (+ seed codes)
5. RolePermission
6. AuditEvent        (полная реализация)
```

Organization.slug — migration **до** Membership (invite-ссылки).

Каждый шаг: Entity → Prisma → CQRS → tests → **CI_GREEN**.

**Auth** (login/session) — после User + Membership, до CRM.

---

## 8. North Star (первый E2E продукт)

```
Tenant → Organization → Invite User → Login → Contact → Call → AI summary → Task
```

---

## 9. Модули NestJS

| Модуль | Агрегаты |
|--------|----------|
| `PlatformModule` | Tenant, Organization |
| **`UsersModule`** | User *(не «UserModule» — весь контекст users)* |
| `RbacModule` | Membership, Role, Permission, RolePermission |
| `AuthModule` | Credential, Session |
| `AuditModule` | AuditEvent |

---

## 10. API (черновик)

```
POST /users/invite     { email, name, organizationId, roleId }
GET  /users/{id}
PATCH /users/{id}      { name, locale, timezone, avatarUrl }

GET  /memberships?organizationId=
PATCH /memberships/{id}   { roleId, isDefault }
POST /memberships/{id}/accept
POST /memberships/{id}/revoke

GET  /roles
POST /roles/{id}/permissions   { permissionId }

GET  /users/me/permissions     effective via active Membership
```

---

## 11. Чеклист утверждения

- [ ] User без roleId / tenantId / organizationId
- [ ] Membership — единственная связь User ↔ Org ↔ Role
- [ ] Permission: code + resource + action + description
- [ ] RolePermission — отдельная таблица
- [ ] Membership: invitedBy, joinedAt, leftAt, isDefault
- [ ] Organization.slug
- [ ] User: locale, timezone, avatarUrl
- [ ] AuditEvent interface зафиксирован
- [ ] 5 сценариев пройдены
- [ ] UsersModule (не UserModule)

**Утверждает:** владелец  
**После утверждения:** `feat(users): add User aggregate` — только User, без Membership
