# 012 — Foundation Domains (Platform Core, Auth, Users, RBAC)

Фундамент AI Sales OS. Проектируется ДО CRM/Inbox (см. `ADR-002`). Кросс-cutting
решения — `ADR-003`. Контексты: `packages/platform-core`, `packages/auth`,
`packages/users`, `packages/rbac`.

---

## A. Platform Core (`packages/platform-core`)

### Агрегаты/сущности
- **Tenant** (root): `id, name, slug, status(ACTIVE|SUSPENDED), createdAt`. Методы: `suspend()`, `activate()`, `rename()`.
- **Organization** (root): `id, tenantId, name, inn?, settingsJson, createdAt`. (Реквизиты компании-арендатора.)
- **Subscription** (root): `id, tenantId, plan(FREE|PRO|BUSINESS), status, seats, currentPeriodEnd`. Методы: `changePlan()`, `setSeats()`, `cancel()`.
- **FeatureFlag** (entity): `id, tenantId?, key, enabled` (глобальные и по tenant).
- **Setting** (entity): `id, tenantId, key, value(jsonb)`.
- **AuditLog** (entity): см. ADR-003 §6.
- **EventOutbox** (entity): см. ADR-003 §2.

### Доменные события
`TenantCreated, TenantSuspended, SubscriptionChanged, FeatureFlagToggled, SettingChanged`.

### CQRS
Commands: `CreateTenant, SuspendTenant, ActivateTenant, ChangePlan, SetSeats,
ToggleFeatureFlag, SetSetting`.
Queries: `GetTenant, GetSubscription, ListFeatureFlags, GetSettings, QueryAuditLog`.

### API
```
POST /tenants                 CreateTenant (онбординг)
GET  /tenants/{id}            GetTenant
POST /tenants/{id}/suspend
GET  /subscription            GetSubscription (текущий tenant)
POST /subscription/plan       ChangePlan
GET  /settings               GetSettings
PUT  /settings/{key}         SetSetting
GET  /feature-flags          ListFeatureFlags
GET  /audit-logs             QueryAuditLog (filter)
```

---

## B. Auth (`packages/auth`)

### Сущности/VO
- **Credential** (часть User или отдельная): `userId, passwordHash(Argon2id)`.
- **Session** (хранится в Redis, не в БД): `sessionId, userId, tenantId, refreshTokenHash, expiresAt, device`.
- VO: `Email`, `Password`(валидация политики), `AccessToken`, `RefreshToken`.

### Сценарии
`Register, Login, RefreshToken, Logout, LogoutAllDevices, RequestPasswordReset,
ResetPassword, VerifyEmail`.
- JWT access 15м (claims: `sub, tenantId, roles`), refresh 30д в Redis с ротацией (ADR-003 §4).
- Пароли Argon2id. Rate-limit на login.

### Доменные события
`UserRegistered, UserLoggedIn, PasswordReset, SessionRevoked`.

### CQRS
Commands: `RegisterCommand, LoginCommand, RefreshCommand, LogoutCommand,
LogoutAllCommand, ResetPasswordCommand`.
Queries: `GetCurrentSession, ListActiveSessions`.

### API
```
POST /auth/register
POST /auth/login            -> { accessToken, refreshToken }
POST /auth/refresh
POST /auth/logout
POST /auth/logout-all
POST /auth/password/reset-request
POST /auth/password/reset
GET  /auth/me               текущий пользователь + роли + tenant
```

---

## C. Users (`packages/users`)

### Агрегат
- **User** (root): `id, tenantId, email, name, status(INVITED|ACTIVE|DISABLED),
  createdAt, lastLoginAt`. Методы: `invite()`, `activate()`, `disable()`, `rename()`, `changeEmail()`.
- **Membership**: связь user↔tenant (один e-mail может состоять в нескольких tenant) —
  `userId, tenantId, status`. (Если поддерживаем мультиарендного пользователя.)

### Инварианты
`email` уникален в рамках tenant; нельзя disable последнего Owner.

### События
`UserInvited, UserActivated, UserDisabled, UserRenamed, UserEmailChanged`.

### CQRS
Commands: `InviteUser, ActivateUser, DisableUser, UpdateUser, AssignRole, RevokeRole`.
Queries: `GetUser, ListUsers, GetUserRoles`.

### API
```
GET  /users            ListUsers
POST /users/invite     InviteUser
GET  /users/{id}       GetUser
PATCH/users/{id}       UpdateUser
POST /users/{id}/disable
POST /users/{id}/roles AssignRole {roleId}
DELETE /users/{id}/roles/{roleId}
```

---

## D. RBAC (`packages/rbac`)

### Модель (ADR-003 §5)
- **Role** (root): `id, tenantId?, key(OWNER|ADMIN|MANAGER|VIEWER|custom), name, isSystem`.
- **Permission** (entity): `id, resource, action` (напр. `deals:assign`).
- **RolePermission**: M:N role↔permission.
- **UserRole**: M:N user↔role (в рамках tenant).

### Матрица (по умолчанию)
| Роль | Права |
|------|-------|
| Owner | всё |
| Admin | всё, кроме `billing:*` |
| Manager | `*:read` + CRUD по своим (фильтр `ownerUserId`) + communications |
| Viewer | `*:read` |

### Проверка прав
Guard `@RequirePermission('deals','update')` → читает роли из JWT/контекста →
сверяет с матрицей. Видимость «только свои» — на уровне репозитория CRM (фильтр owner).

### События
`RoleAssigned, RoleRevoked, PermissionGranted, PermissionRevoked`.

### CQRS
Commands: `CreateRole, GrantPermission, RevokePermission, AssignRoleToUser, RevokeRoleFromUser`.
Queries: `ListRoles, GetRolePermissions, GetUserPermissions`.

### API
```
GET  /roles
POST /roles
GET  /roles/{id}/permissions
POST /roles/{id}/permissions       GrantPermission
DELETE /roles/{id}/permissions/{permId}
```

---

## E. Тесты (все 4 контекста)
- **Unit:** VO (Email, Password policy), инварианты (нельзя disable последнего Owner; уникальность email/tenant), проверка матрицы RBAC.
- **Integration:** репозитории + RLS (запрос из tenant A не видит данные tenant B), login/refresh/logout-all через Redis, outbox-публикация события в транзакции.
- **E2E:** онбординг tenant → инвайт пользователя → логин → назначение роли Manager → проверка, что Manager видит только свои сделки.

## F. Зависимости
Platform Core (tenant/outbox/audit/settings) → Auth (session) → Users → RBAC →
далее CRM (`011`) и Inbox (Stage 3).
