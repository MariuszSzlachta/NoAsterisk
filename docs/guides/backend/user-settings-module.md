# User Settings Module — Developer Guide

## Domain Context

Authenticated users need to manage their profile (display name), change their password, store encrypted data backups (vault), log out, and permanently delete their account. The user-settings module provides these self-service operations as a separate module from `auth/`, consuming auth's exported ports without extending auth's internal structure.

---

## Architecture & Layers

```
src/user-settings/
├── domain/
│   ├── vault.entity.ts              # Encrypted data backup entity (workspace-scoped)
│   ├── vault.entity.spec.ts         # Invariant tests
│   └── ports/
│       └── vault-repository.ts      # VaultRepository port
│
├── application/
│   ├── commands/
│   │   ├── change-password.handler.ts      # Validates current → hashes new → saves
│   │   ├── update-profile.handler.ts       # Sets/clears displayName on User entity
│   │   ├── update-preferences.handler.ts   # Partial merge of user preferences
│   │   ├── upload-vault.handler.ts         # Create or update encrypted vault blob
│   │   ├── delete-account.handler.ts       # Password confirm → cascade delete user data
│   │   └── logout.handler.ts              # Stateless no-op (v1)
│   ├── queries/
│   │   ├── get-profile.handler.ts          # User → ProfileResponseDto via mapper
│   │   └── get-vault.handler.ts            # Returns vault blob or explicit empty state
│   └── mappers/
│       └── profile-response.mapper.ts      # User entity → ProfileResponseDto (ROLE_MAP)
│
├── infrastructure/
│   ├── in-memory-vault.repository.ts       # In-memory adapter for tests
│   └── postgres-vault.repository.ts        # PostgreSQL CAS adapter
│
├── presentation/
│   ├── user-settings.controller.ts         # All endpoints under /users/me
│   └── dto/
│       ├── change-password.dto.ts          # Zod: currentPassword + newPassword (strong)
│       ├── update-profile.dto.ts           # Zod: displayName(max 50), empty string = clear
│       ├── update-preferences.dto.ts       # Zod: partial preferences with z.enum per field
│       ├── upload-vault.dto.ts             # Zod: encryptedBlob(min 1, max 10MB)
│       └── delete-account.dto.ts           # Zod: password(min 1)
│
└── user-settings.module.ts                 # Imports AuthModule, provides handlers + vault repo
```

### Dependency on Auth Module

UserSettingsModule imports `AuthModule` and consumes the following exported tokens:

| Token | Purpose |
|-------|---------|
| `USER_REPOSITORY` | Read/save/delete User entity |
| `PASSWORD_HASHER` | Verify current password, hash new password |
| `PERMISSION_REPOSITORY` | Delete permissions on account deletion |

The module does NOT re-declare these providers — it relies on NestJS module imports (no duplicate instances).

---

## Domain — Vault Entity

The `Vault` entity stores an opaque encrypted blob per workspace. It serves as a client-side backup mechanism for encrypted user data (e.g., keys, settings). The backend never decrypts vault contents.

```typescript
class Vault {
  constructor(id, workspaceId, encryptedBlob, createdAt, updatedAt) // invariants: all non-empty
  static create({ workspaceId, encryptedBlob }): Vault              // generates UUID + timestamps
  updateBlob(encryptedBlob: string): Vault                          // immutable update, new updatedAt
}
```

Invariants:
- `id`, `workspaceId`, `encryptedBlob` must be non-empty (throws `DomainError`)
- Maximum blob size enforced at DTO level: 10MB (base64, ~7.5MB decoded)
- One vault per workspace (upsert semantics via handler)

### User Entity Extensions

The `User` entity in `auth/domain/` gained fields and methods for this module:

- **`displayName?: string`** — optional display name, max 50 chars
- **`preferences: UserPreferences`** — defaults to `DEFAULT_PREFERENCES` (PLN, DD.MM.YYYY, pl, dark, dashboard)
- `updateDisplayName(name: string): User` — trims whitespace, empty string clears to `undefined`, max 50 chars
- `changePassword(newPasswordHash: string): User` — replaces hash (immutable, all fields propagated)
- `updatePreferences(partial: Partial<UserPreferences>): User` — merges partial into current preferences

All return new `User` instances (immutable pattern). Every mutation method propagates all fields including `preferences`.

---

## Public API

### HTTP Endpoints (all require authentication)

| Method | Path | Status | Description |
|--------|------|--------|-------------|
| `GET` | `/users/me` | 200 | Current user profile (includes preferences) |
| `PATCH` | `/users/me` | 200 | Update display name |
| `PATCH` | `/users/me/preferences` | 200 | Update preferences (partial merge) |
| `POST` | `/users/me/change-password` | 200 | Change password |
| `PUT` | `/users/me/vault` | 200 | Upload/replace encrypted vault |
| `GET` | `/users/me/vault` | 200 | Get encrypted vault or explicit empty state |
| `POST` | `/users/me/logout` | 200 | Logout (stateless v1) |
| `DELETE` | `/users/me` | 204 | Delete account (password required) |

### Response Shapes

**GET /users/me → ProfileResponseDto**
```typescript
{
  id: string;
  email: string;
  displayName: string | undefined;
  role: 'Superuser' | 'Member' | 'Blocked';  // explicit ROLE_MAP, no type assertions
  workspaceId: string;
  createdAt: string;                  // ISO 8601
  preferences: {
    currency: 'PLN' | 'EUR' | 'USD' | 'GBP';
    dateFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
    language: 'pl' | 'en';
    theme: 'dark' | 'light' | 'system';
    homePage: 'dashboard' | 'transactions' | 'import';
  };
}
```

**PATCH /users/me → UpdateProfileResult**
```typescript
{ displayName: string | undefined }
```

**PATCH /users/me/preferences → UpdatePreferencesResult**
```typescript
{
  preferences: {
    currency: 'PLN' | 'EUR' | 'USD' | 'GBP';
    dateFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
    language: 'pl' | 'en';
    theme: 'dark' | 'light' | 'system';
    homePage: 'dashboard' | 'transactions' | 'import';
  }
}
// Returns the FULL merged preferences after update
```

**POST /users/me/change-password → ChangePasswordResult**
```typescript
{ success: true }
```

**PUT /users/me/vault → UploadVaultResult**
```typescript
{
  encryptedBlob: string;
  byteSize: number;
  contentHash: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
```

**GET /users/me/vault → VaultResult**
```typescript
{ status: 'empty' }
// or
{
  status: 'available';
  encryptedBlob: string;
  byteSize: number;
  contentHash: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
```

**POST /users/me/logout → LogoutResult**
```typescript
{ success: true }
```

**DELETE /users/me** — 204 No Content (empty body)

### Request Validation (Zod)

| Endpoint | Schema | Rules |
|----------|--------|-------|
| PATCH /users/me | `updateProfileSchema` | `displayName`: string, max 50. Empty string = clear. `.strict()` |
| PATCH /users/me/preferences | `updatePreferencesSchema` | All fields optional `z.enum(...)`. At least one required. `.strict()` |
| POST change-password | `changePasswordSchema` | `currentPassword`: min 1. `newPassword`: min 8, max 128. `.strict()` |
| PUT vault | `uploadVaultSchema` | `encryptedBlob`: strict base64, max 10,000,000 encoded / 7,500,000 decoded bytes; `baseRevision`: integer >= 0. `.strict()` |
| DELETE /users/me | `deleteAccountSchema` | `password`: min 1. `.strict()` |

---

## Key Behaviors

### Display Name Semantics

- Empty string `""` → clears display name (sets to `undefined` on entity)
- Non-empty string → trimmed and validated (max 50 chars)
- Whitespace-only string → treated as empty after trim → clears

### Change Password

1. Verify current password against stored hash
2. Verify new password differs from current (prevents no-op changes)
3. Hash new password → `user.changePassword(hash)` → save

### Preferences

User preferences are server-persisted settings synced across devices on login.

**Value Object:** `UserPreferences` in `auth/domain/user-preferences.vo.ts`

| Field | Type | Default | Options |
|-------|------|---------|---------|
| `currency` | string literal | `'PLN'` | PLN, EUR, USD, GBP |
| `dateFormat` | string literal | `'DD.MM.YYYY'` | DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY |
| `language` | string literal | `'pl'` | pl, en |
| `theme` | string literal | `'dark'` | dark, light, system |
| `homePage` | string literal | `'dashboard'` | dashboard, transactions, import |

**Sync strategy:**
- Backend is source of truth
- Frontend writes to localStorage immediately (instant UI) + async PATCH to backend
- On login: `GET /users/me` → preferences → overwrite localStorage
- Partial PATCH: send only changed fields, backend merges with existing

**User entity method:** `user.updatePreferences(partial)` merges partial with current and returns new User instance.

### Opaque Vault Sync API

The vault endpoint is a zero-knowledge relay. The server stores the base64
ciphertext and transport metadata only; it never parses, decrypts or validates
the client snapshot schema.

`GET /users/me/vault` is always `200` and returns either `{ status: "empty" }`
or `{ status: "available", encryptedBlob, byteSize, contentHash, revision,
createdAt, updatedAt }`. `PUT /users/me/vault` requires
`{ encryptedBlob, baseRevision }`, where `baseRevision: 0` means that the client
observed no remote snapshot. A first write creates revision `1`; a write based
on the current revision advances it atomically. A stale base revision returns
`409 Conflict` and cannot replace the newer snapshot.

An identical ciphertext retry is idempotent when it refers to the current
snapshot (including a retry after a lost response), but it does not authorize a
different stale ciphertext. `encryptedBlob` must be strict base64, no larger
than 10,000,000 encoded bytes or 7,500,000 decoded bytes. JSON parser overflow
is rejected with `413`; DTO violations are rejected with `400`.

The database stores SHA-256 of the exact encoded ciphertext, its UTF-8 byte
size, revision and timestamps. Existing rows are migrated with revision `1`
and calculated transport metadata. Retention follows the workspace row: one
current snapshot is retained, and deleting the workspace/account deletes it.
There is no server-side history, merge, rollback or recovery from an overwrite;
clients must keep any local encrypted copy they need for recovery.

All reads, writes and deletes are workspace-scoped through the authenticated
user context. Logs may contain request correlation data, byte size and revision,
but never ciphertext, hashes derived from plaintext, passwords, keys or
decrypted financial data.

### Logout (v1 — Stateless)

The handler validates the userId is non-empty and returns `{ success: true }`. No server-side token invalidation occurs. The client is expected to discard the JWT.

Future v2: token blacklist with TTL matching access token expiry (Redis or DB), gated by persistence phase.

### Delete Account

Deletion order:
1. Verify user exists
2. Verify workspace ownership (`user.workspaceId === command.workspaceId`)
3. Verify password (hash comparison)
4. Delete vault (by workspaceId)
5. Delete permissions (by userId)
6. Delete user

**ARCH-EXCEPTION:** Domain data (transactions, categories, budgets, workspace entity) is NOT deleted on account deletion. In the current single-user-per-workspace model, orphaned data becomes inaccessible. Cascade delete via domain events or explicit cleanup service planned for Phase 5.

---

## Extension Points

### Adding token blacklist (v2 logout)

1. Create `domain/ports/token-blacklist.port.ts` interface
2. Implement with Redis or DB adapter in `infrastructure/`
3. Inject into `LogoutHandler` — add token to blacklist with TTL
4. Add check in `JwtAuthGuard` (auth module) — reject blacklisted tokens

### PostgreSQL vault persistence

The production adapter is `PostgresVaultRepository`, selected by
`PERSISTENCE_MODE=postgres`. The `vaults` table stores one opaque snapshot per
workspace with `content_hash`, UTF-8 `byte_size` and monotonic `revision` metadata.
The update path uses `WHERE workspace_id = ? AND revision = ?`, so PostgreSQL
performs the compare-and-swap atomically. Legacy rows receive revision `1` and
calculated transport metadata through migration `0003_opaque_vault_sync_metadata.sql`.

### Adding profile fields (avatar, locale, timezone)

1. Add field to `User` entity constructor + `updateDisplayName` renamed to `updateProfile`
2. Extend `UpdateProfileDto` Zod schema
3. Extend `ProfileResponseMapper.toDto()`
4. Add tests for new field invariants

### Cascade delete (Phase 5)

When domain event infrastructure exists:
1. Emit `AccountDeletedEvent { userId, workspaceId }` from handler
2. Subscribers in each module handle their own cleanup
3. Remove ARCH-EXCEPTION comment

---

## Boundaries & Non-Goals

**Does:** Profile read/update, password change, vault CRUD, logout signal, account deletion (user + permissions + vault), admin user listing, admin block/unblock, admin user deletion

**Does NOT:**
- Token invalidation / blacklist (planned — v2 logout)
- Domain data cascade on delete (planned — Phase 5)
- Email change (would require verification flow — post-MVP)
- Avatar upload (planned — separate file storage concern)
- Session management / device listing (not planned)
- Bulk admin operations (block/delete multiple users)

---

## Trade-offs

| Decision | Rationale |
|----------|-----------|
| Separate module (not extending auth/) | SRP: auth handles identity/tokens, settings handles user self-service. Avoids auth module bloat. |
| Vault as domain entity (not raw blob storage) | Invariant enforcement, immutable updates, workspace-scope by design |
| Stateless logout v1 | No persistence infrastructure yet; client-side discard is acceptable for MVP with short-lived JWTs (15m) |
| Password confirmation on delete | Prevents accidental deletion from stolen session; workspace ownership check adds defense-in-depth |
| `ROLE_MAP` record in mapper | Exhaustive enum-to-literal mapping without type assertions; new enum value causes compile error |
| Empty string = clear displayName | Explicit semantic documented in DTO; avoids `null` vs `undefined` ambiguity |
| Vault max 10MB string | Base64 overhead ~33%, so ~7.5MB real data; sufficient for key backups without DoS risk |

---

## Testing Strategy

```bash
cd server && npx jest --testPathPattern=user-settings --verbose
```

| File | Tests | Coverage |
|------|-------|----------|
| `domain/vault.entity.spec.ts` | 8 | Constructor invariants (4), create (2), updateBlob (2) |
| `application/commands/change-password.handler.spec.ts` | 4 | Happy path, wrong password, not found, same-as-current |
| `application/commands/update-profile.handler.spec.ts` | 5 | Set name, trim, clear (empty), too long, not found |
| `application/commands/update-preferences.handler.spec.ts` | 4 | Partial merge, full replace, preserve unchanged, not found |
| `application/commands/upload-vault.handler.spec.ts` | 2 | Create new, update existing |
| `application/commands/delete-account.handler.spec.ts` | 4 | Happy path, wrong password, workspace mismatch, not found |
| `application/commands/logout.handler.spec.ts` | 2 | Success, empty userId |
| `application/queries/get-profile.handler.spec.ts` | 2 | Returns DTO (with preferences), not found |
| `application/queries/get-vault.handler.spec.ts` | 2 | Returns data, not found |
| `application/mappers/profile-response.mapper.spec.ts` | 3 | Member mapping, Superuser + no displayName, custom preferences |

**Total: 36 tests** covering domain invariants, handler orchestration, error paths, preferences merge, and mapper correctness.

---

*Generated: 2026-08-21 | Source: `server/src/user-settings/`, `server/src/auth/domain/user.entity.ts`*
