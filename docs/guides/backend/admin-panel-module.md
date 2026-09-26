# Admin Panel Module — Developer Guide

## Domain Context

Platform administrators (Superusers) need to manage user access and control registration. The admin panel provides invite code management (generate, list, revoke codes), user listing, user blocking/unblocking, and administrative user deletion. Registration can operate in `invite-only` mode (requiring a valid code) or `open` mode.

The admin panel is split across two modules:
- **invite-codes** — new module owning invite code lifecycle
- **user-settings** — extended with admin user management endpoints

---

## Architecture & Layers

### Invite Codes Module

```
src/invite-codes/
├── domain/
│   ├── invite-code.entity.ts           # Rich entity: create, redeem, isAvailable, assignUser
│   ├── invite-code.entity.spec.ts      # 17 invariant + behavior tests
│   ├── invite-code-status.enum.ts      # Available | Used | Expired
│   └── ports/
│       └── invite-code.repository.ts   # ARCH-EXCEPTION: global-scope (not workspace-scoped)
│
├── application/
│   ├── commands/
│   │   ├── generate-code.handler.ts    # Creates code via entity factory → saves
│   │   ├── delete-code.handler.ts      # Validates Available status → deletes
│   │   ├── redeem-code.handler.ts      # Validates + redeems atomically
│   │   └── invite-code-handlers.spec.ts # 14 handler tests
│   ├── queries/
│   │   └── get-invite-codes.handler.ts # Fetches all → maps to DTO list
│   ├── mappers/
│   │   └── invite-code-response.mapper.ts # Entity → DTO (with effective status computation)
│   └── dto/
│       └── invite-code-response.dto.ts # Public response interface
│
├── infrastructure/
│   ├── in-memory-invite-code.repository.ts
│   └── postgres-invite-code.repository.ts  # Drizzle ORM, upsert on save
│
├── presentation/
│   ├── invite-codes.controller.ts      # GET/POST/DELETE under /admin/invite-codes
│   ├── invite-codes.controller.spec.ts # 10 HTTP contract tests
│   └── dto/
│       └── generate-code.dto.ts        # Zod: optional expiresAt (ISO datetime)
│
└── invite-codes.module.ts              # Exports: RedeemCodeHandler, INVITE_CODE_REPOSITORY
```

### Admin Users (in user-settings module)

```
src/user-settings/
├── application/
│   ├── commands/
│   │   ├── block-user.handler.ts         # Toggle: Member ↔ Blocked (increments tokenVersion)
│   │   ├── admin-delete-user.handler.ts  # Cascade: vault → permissions → user
│   │   └── admin-handlers.spec.ts        # 10 unit tests
│   └── queries/
│       └── get-all-users.handler.ts      # All users → AdminUserDto (ROLE_MAP)
│
└── presentation/
    └── admin-users.controller.ts         # GET/PATCH/DELETE under /admin/users
    └── admin-users.controller.spec.ts    # 7 HTTP contract tests
```

### Dependency Graph

```
AuthModule
  ├── imports InviteCodesModule (for INVITE_CODE_REPOSITORY in RegisterHandler)
  └── provides REGISTRATION_MODE value token

UserSettingsModule
  ├── imports AuthModule (for USER_REPOSITORY, PERMISSION_REPOSITORY)
  └── provides admin handlers (BlockUserHandler, AdminDeleteUserHandler, GetAllUsersHandler)
```

---

## Domain — InviteCode Entity

```typescript
class InviteCode {
  constructor(id, code, createdBy, status, createdAt, expiresAt?, usedBy?, usedAt?)
  static create({ createdBy, expiresAt? }): InviteCode  // 8-char uppercase hex code
  redeem(userId: string): InviteCode                     // Available → Used, sets usedBy/usedAt
  isAvailable(): boolean                                 // Checks status + expiry
  assignUser(userId: string): InviteCode                 // Updates usedBy (post-registration)
}
```

**Invariants:**
- `id` must be non-empty
- `code` must be ≥6 characters
- `createdBy` must be non-empty
- `redeem()` throws if status ≠ Available or if expired
- Immutable pattern — all mutation methods return new instances

**Status transitions:**
```
Available → Used     (via redeem)
Available → Expired  (effective status computed by mapper when expiresAt < now)
```

### User Entity Extensions (in auth/domain/)

| Method | Behavior |
|--------|----------|
| `block(): User` | Member → Blocked, increments tokenVersion. Throws if Superuser or already Blocked. |
| `unblock(): User` | Blocked → Member. Throws if not Blocked. |
| `incrementTokenVersion(): User` | Returns new User with tokenVersion + 1 |

---

## Public API

### Invite Codes Endpoints (Superuser only)

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/api/admin/invite-codes` | 200 | List all invite codes |
| `POST` | `/api/admin/invite-codes` | 201 | Generate new invite code |
| `DELETE` | `/api/admin/invite-codes/:id` | 204 | Revoke an unused code |

### Admin Users Endpoints (Superuser only)

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/api/admin/users` | 200 | List all users |
| `PATCH` | `/api/admin/users/:id/block` | 204 | Toggle block/unblock |
| `DELETE` | `/api/admin/users/:id` | 204 | Delete user (cascade) |

### Response Shapes

**GET /admin/invite-codes → InviteCodeResponseDto[]**
```typescript
{
  id: string;
  code: string;                              // 8-char uppercase hex (e.g. "A3F2B91C")
  status: 'Available' | 'Used' | 'Expired';  // Effective status (computed)
  createdAt: string;                          // ISO 8601
  expiresAt: string | null;
  usedBy: string | null;                      // userId who redeemed
  usedAt: string | null;                      // ISO 8601
}
```

**POST /admin/invite-codes → InviteCodeResponseDto** (same shape as above)

**GET /admin/users → AdminUserDto[]**
```typescript
{
  id: string;
  email: string;
  role: 'Superuser' | 'Member' | 'Blocked';
  workspaceId: string;
  createdAt: string;          // ISO 8601
  displayName: string | null;
}
```

### Request Validation (Zod)

| Endpoint | Schema | Rules |
|----------|--------|-------|
| POST /admin/invite-codes | `generateCodeSchema` | `expiresAt`: ISO datetime, optional. `.strict()` |
| DELETE /admin/invite-codes/:id | `UuidParam` | Path param must be valid UUID |
| PATCH /admin/users/:id/block | `UuidParam` | Path param must be valid UUID |
| DELETE /admin/users/:id | `UuidParam` | Path param must be valid UUID |

---

## Registration Mode

The `REGISTRATION_MODE` environment variable controls registration behavior:

| Value | Behavior |
|-------|----------|
| `invite-only` (default) | Registration requires a valid invite code |
| `open` | Registration succeeds without invite code |

**Injection:** Provided as a value token in `AuthModule`:
```typescript
{ provide: REGISTRATION_MODE, useValue: process.env['REGISTRATION_MODE'] ?? 'invite-only' }
```

**Registration flow with invite code:**
1. Validate invite code exists and `isAvailable()` → throw `DomainError` if invalid
2. Atomically claim code (`redeem('pending')`) — prevents race conditions
3. Create workspace → user → permission (standard flow)
4. Update code with actual `userId` via `assignUser()`

**Zod validation on registration DTO:**
```typescript
inviteCode: z.string().regex(/^[A-Z0-9]{6,8}$/).optional()
```

---

## Key Behaviors

### Blocked User Enforcement

Blocking a user triggers immediate session invalidation via `tokenVersion` increment:

1. **Block action** (`PATCH /admin/users/:id/block`) → `user.block()` increments `tokenVersion`
2. **JwtAuthGuard** — checks `payload.role === 'Blocked'` → rejects with 401 "Account is blocked"
3. **LoginHandler** — checks `user.role === UserRole.Blocked` → rejects with generic "Invalid credentials"

Effect: A blocked user's existing JWTs become invalid at the guard level (role check), and new login attempts fail.

### Toggle Block Semantics

`PATCH /admin/users/:id/block` is a toggle:
- Member → Blocked (increments tokenVersion)
- Blocked → Member (restores access)

**Protections:**
- Cannot block yourself (prevents admin lockout)
- Cannot block a Superuser (entity invariant throws)

### Administrative User Deletion

Deletion cascade order:
1. Verify target is not self (prevents admin lockout)
2. Verify target exists and is not Superuser
3. Delete vault (by workspaceId)
4. Delete permissions (by userId)
5. Delete user

**ARCH-EXCEPTION:** Domain data (transactions, categories, budgets, workspace entity) is NOT deleted. Same limitation as self-service delete-account. Cascade via domain events planned for Phase 5.

### Effective Status Computation

The response mapper computes display status: if a code has `status = Available` but `expiresAt < now`, it displays as `Expired`. This provides accurate status in the admin UI without requiring a background job to mark expired codes.

---

## Scope Exceptions

### Global-Scope Repository (ARCH-EXCEPTION)

The `InviteCodeRepository` is intentionally **not** workspace-scoped:

> Invite codes are Superuser-only admin resources. A code is generated by any Superuser and redeemed globally during registration (before workspace exists).

- `findAll()` returns all codes across the platform
- `findByCode()` is a global lookup (used during registration)
- Documented with `ARCH-EXCEPTION: global-scope` comment on the port interface

### UserRepository.findAll() (ARCH-EXCEPTION)

`findAll()` on UserRepository is also global-scope — it's used exclusively by the Superuser admin endpoint to list all platform users.

---

## Persistence — Drizzle Schema

```sql
CREATE TABLE invite_codes (
  id          UUID PRIMARY KEY,
  code        VARCHAR(8) NOT NULL UNIQUE,
  created_by  UUID NOT NULL REFERENCES users(id),
  status      VARCHAR(20) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ,
  used_by     UUID REFERENCES users(id),
  used_at     TIMESTAMPTZ
);
```

The Postgres repository uses `onConflictDoUpdate` on save (upsert by id), updating only mutable fields (`status`, `usedBy`, `usedAt`).

---

## Module Exports

### InviteCodesModule exports:
| Export | Consumer | Purpose |
|--------|----------|---------|
| `RedeemCodeHandler` | AuthModule (RegisterHandler) | Invite code validation during registration |
| `INVITE_CODE_REPOSITORY` | AuthModule (RegisterHandler) | Direct repo access for atomic claim + assign |

### UserSettingsModule exports:
| Export | Consumer | Purpose |
|--------|----------|---------|
| `BlockUserHandler` | — | Available for cross-module use if needed |
| `AdminDeleteUserHandler` | — | Available for cross-module use if needed |
| `GetAllUsersHandler` | — | Available for cross-module use if needed |

---

## Extension Points

### Adding invite code expiry cleanup (background job)
1. Create a NestJS `@Cron()` service in `invite-codes/infrastructure/`
2. Query codes where `status = Available AND expiresAt < now()`
3. Transition to `Expired` status — or rely on effective status (current approach)

### Adding rate limiting on code generation
Apply `@Throttle()` decorator on `POST /admin/invite-codes` in controller.

### Adding code usage statistics / audit trail
1. Extend `InviteCodeResponseDto` with `redeemedUser?: { email, displayName }`
2. Mapper joins `usedBy` → user data from UserRepository (would require injecting it)

### Switching to email-based invites (Phase 5+)
1. Add `email` field to InviteCode entity (target recipient)
2. New handler: `SendInviteEmailHandler` — sends code via email service port
3. Controller: `POST /admin/invites` with `{ email, expiresAt? }`

---

## Boundaries & Non-Goals

**Does:** Invite code CRUD, user listing, block toggle, admin user deletion, registration mode control

**Does NOT:**
- Email-based invitations (post-MVP)
- Audit logging of admin actions (planned)
- Bulk operations (block/delete multiple users)
- Workspace management (admin creating/deleting workspaces)
- Role promotion (Member → Superuser) — no endpoint exists
- Domain data cascade on user deletion (Phase 5)

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Global-scope invite code repository | Codes are redeemed before workspace exists; workspace-scoping is meaningless |
| Toggle block (not separate block/unblock endpoints) | Simpler API surface; frontend shows current state and toggles |
| `tokenVersion` increment on block | Immediate session invalidation without token blacklist infrastructure |
| Atomic code claiming with 'pending' userId | Prevents race condition where two registrations use same code; accepted that a failed registration consumes the code |
| Effective status computation in mapper | Avoids background job complexity; expired codes are accurately displayed without DB updates |
| Admin delete doesn't cascade domain data | Same limitation as self-service delete; bounded by current single-user-per-workspace model |
| `invite-only` as default REGISTRATION_MODE | Security-first: prevents unauthorized registration in production |

---

## Testing Strategy

```bash
cd server && npx jest --testPathPattern="invite-codes|admin" --verbose
```

### Invite Codes Module

| File | Tests | Coverage |
|------|-------|----------|
| `domain/invite-code.entity.spec.ts` | 17 | Constructor invariants (3), create (5), redeem (4), isAvailable (4), assignUser (1) |
| `application/commands/invite-code-handlers.spec.ts` | 14 | Generate (3), Delete (3), Redeem (4), GetAll (2) + response mapping |
| `presentation/invite-codes.controller.spec.ts` | 10 | GET list (2), POST generate (4), DELETE revoke (4) |

### Admin Users (in user-settings)

| File | Tests | Coverage |
|------|-------|----------|
| `application/commands/admin-handlers.spec.ts` | 10 | BlockUser (6: block, unblock, self, not found, superuser, tokenVersion), AdminDelete (4: cascade, self, not found, superuser) |
| `presentation/admin-users.controller.spec.ts` | 7 | GET list (1), PATCH block (4: block, unblock, superuser, invalid UUID), DELETE (3: success, self, invalid UUID) |

**Total admin panel tests: 58**

---

*Generated: 2026-08-22 | Source: `server/src/invite-codes/`, `server/src/user-settings/`, `server/src/auth/`*
