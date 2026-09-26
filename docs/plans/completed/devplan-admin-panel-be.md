# Devplan BE: Admin Panel

## Context

Admin endpoints for Superuser role. Two new modules: invite-codes, admin-users. Plus configuration for closed registration mode.

**Architecture:** Hexagonal, CQRS-lite, dual persistence (InMemory + Postgres). Guards: existing `RolesGuard` + `@Roles('Superuser')` decorator.

**Existing infrastructure:**
- `UserRole.Superuser` enum exists
- `User.isSuperuser()` method exists
- `RolesGuard` registered globally (APP_GUARD)
- `@Roles()` decorator exists
- `@Public()` decorator exists
- `UserRepository` with findById, findByEmail, existsByEmail, save, delete

---

## Bullet 1: Domain — InviteCode entity

**Scope:** `server/src/invite-codes/domain/`

**Create:**
```
server/src/invite-codes/domain/
  invite-code.entity.ts
  invite-code.entity.spec.ts
  invite-code-status.enum.ts
  ports/
    invite-code.repository.ts
```

**InviteCodeStatus enum:**
```typescript
export enum InviteCodeStatus {
  Available = 'Available',
  Used = 'Used',
  Expired = 'Expired',
}
```

**InviteCode entity:**
```typescript
export class InviteCode {
  constructor(
    readonly id: string,
    readonly code: string,
    readonly createdBy: string,       // userId of admin who generated
    readonly status: InviteCodeStatus,
    readonly createdAt: Date,
    readonly expiresAt: Date | undefined,
    readonly usedBy: string | undefined,     // userId who redeemed
    readonly usedAt: Date | undefined,
  ) {
    if (!id) throw new DomainError('InviteCode ID is required');
    if (!code || code.length < 6) throw new DomainError('InviteCode must be at least 6 characters');
    if (!createdBy) throw new DomainError('InviteCode createdBy is required');
  }

  static create(props: { createdBy: string; expiresAt?: Date }): InviteCode {
    const code = crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();
    return new InviteCode(
      crypto.randomUUID(),
      code,
      props.createdBy,
      InviteCodeStatus.Available,
      new Date(),
      props.expiresAt,
      undefined,
      undefined,
    );
  }

  redeem(userId: string): InviteCode {
    if (this.status !== InviteCodeStatus.Available) {
      throw new DomainError('Invite code is not available');
    }
    if (this.expiresAt && this.expiresAt < new Date()) {
      throw new DomainError('Invite code has expired');
    }
    return new InviteCode(
      this.id, this.code, this.createdBy,
      InviteCodeStatus.Used,
      this.createdAt, this.expiresAt,
      userId, new Date(),
    );
  }

  isAvailable(): boolean {
    if (this.status !== InviteCodeStatus.Available) return false;
    if (this.expiresAt && this.expiresAt < new Date()) return false;
    return true;
  }
}
```

**Repository port:**
```typescript
export const INVITE_CODE_REPOSITORY = Symbol('INVITE_CODE_REPOSITORY');

export interface InviteCodeRepository {
  save(code: InviteCode): Promise<InviteCode>;
  findById(id: string): Promise<InviteCode | undefined>;
  findByCode(code: string): Promise<InviteCode | undefined>;
  findAll(): Promise<ReadonlyArray<InviteCode>>;
  delete(id: string): Promise<void>;
}
```

**Gate:** `tsc --noEmit` clean. Entity tests: create() generates 8-char code, redeem() transitions status, double-redeem throws, expired check works.

---

## Bullet 2: Infrastructure — InviteCode repositories

**Scope:** `server/src/invite-codes/infrastructure/`

**Create:**
```
server/src/invite-codes/infrastructure/
  in-memory-invite-code.repository.ts
  postgres-invite-code.repository.ts
```

**Schema** (`server/src/shared/infrastructure/database/schema/invite-codes.schema.ts`):
```typescript
export const inviteCodes = pgTable('invite_codes', {
  id: uuid('id').primaryKey(),
  code: varchar('code', { length: 8 }).notNull().unique(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  status: varchar('status', { length: 20 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  usedBy: uuid('used_by').references(() => users.id),
  usedAt: timestamp('used_at', { withTimezone: true }),
});
```

**Gate:** Both repos implement port. Drizzle migration generated.

---

## Bullet 3: Application — InviteCode handlers

**Scope:** `server/src/invite-codes/application/`

**Create:**
```
server/src/invite-codes/application/
  commands/
    generate-code.handler.ts       ← creates new InviteCode
    delete-code.handler.ts         ← deletes if status=Available
    redeem-code.handler.ts         ← called during registration
  queries/
    get-invite-codes.handler.ts    ← returns all codes with status
  mappers/
    invite-code-response.mapper.ts
  dto/
    invite-code-response.dto.ts
```

**GenerateCodeHandler:**
- Input: `{ createdBy: string; expiresAt?: string }`
- Creates entity via `InviteCode.create()`
- Saves to repo
- Returns generated code

**DeleteCodeHandler:**
- Input: `{ id: string }`
- Finds by id → if not Available, throw DomainError
- Deletes

**RedeemCodeHandler:**
- Input: `{ code: string; userId: string }`
- Finds by code → validates isAvailable() → redeems → saves
- Called from RegisterHandler (not directly from controller)

**GetInviteCodesHandler:**
- Returns all codes with mapped response (code, status, createdAt, usedBy email)
- Joins with User to get usedBy email (or just return userId — let FE resolve)

**Response DTO:**
```typescript
interface InviteCodeResponseDto {
  readonly id: string;
  readonly code: string;
  readonly status: 'Available' | 'Used' | 'Expired';
  readonly createdAt: string;
  readonly expiresAt: string | null;
  readonly usedBy: string | null;    // email
  readonly usedAt: string | null;
}
```

**Gate:** Handler tests with mocked repo. Generate, redeem, delete flows covered.

---

## Bullet 4: Presentation — InviteCodes controller

**Scope:** `server/src/invite-codes/presentation/`

**Create:**
```
server/src/invite-codes/presentation/
  invite-codes.controller.ts
  invite-codes.controller.spec.ts
  dto/
    generate-code.dto.ts
```

**Endpoints:**
```
GET    /api/admin/invite-codes      ← @Roles('Superuser'), list all codes
POST   /api/admin/invite-codes      ← @Roles('Superuser'), generate new code
DELETE /api/admin/invite-codes/:id   ← @Roles('Superuser'), revoke unused code
```

**Zod schema:**
```typescript
export const GenerateCodeSchema = z.object({
  expiresAt: z.string().datetime().optional(),
});
```

**Gate:** Controller spec: 201 on generate, 200 on list, 403 for non-superuser, 400 on invalid.

---

## Bullet 5: Registration flow — invite-only mode

**Scope:** `server/src/auth/application/commands/register.handler.ts`

**Changes:**
1. Add env var: `REGISTRATION_MODE=open|invite-only` (default: `invite-only`)
2. Add optional field `inviteCode?: string` to RegisterCommand
3. In RegisterHandler.execute():
   - If mode=`invite-only` and no inviteCode → throw DomainError('Invite code required')
   - If inviteCode provided → call `RedeemCodeHandler.execute({ code, userId })`
   - If code invalid/used/expired → throw DomainError('Invalid invite code')
4. Update register Zod DTO to accept optional `inviteCode` field

**Gate:** Registration without code fails when mode=invite-only. Valid code → registration succeeds + code marked as used. mode=open → code not required.

---

## Bullet 6: Admin users endpoints

**Scope:** Extend `server/src/user-settings/` or create `server/src/admin/`

**Decision:** Add to existing `user-settings` module (it already has UserRepository access) as admin-specific handlers.

**Create:**
```
server/src/user-settings/application/
  queries/
    get-all-users.handler.ts       ← returns all users (Superuser only)
  commands/
    block-user.handler.ts          ← sets role to 'Blocked' + increments tokenVersion
    admin-delete-user.handler.ts   ← deletes user + workspace (Superuser only)
```

**Extend controller:**
```
GET    /api/admin/users             ← @Roles('Superuser'), paginated user list
PATCH  /api/admin/users/:id/block   ← @Roles('Superuser'), toggle block
DELETE /api/admin/users/:id         ← @Roles('Superuser'), delete user
```

**GetAllUsersHandler:**
- Returns: id, email, role, createdAt, workspaceId, hasVault (boolean from vault repo)
- Paginated (page, limit query params)
- Searchable by email (optional query param `?search=`)

**BlockUserHandler:**
- Finds user by id
- If currently Blocked → set role to Member (unblock)
- If currently Member → set role to Blocked + incrementTokenVersion (kills sessions)
- Cannot block Superuser (self-protection)

**AdminDeleteUserHandler:**
- Finds user → deletes vault → deletes permissions → deletes user
- Cannot delete self

**Gate:** Endpoints return correct data. Non-superuser gets 403. Cannot block/delete self.

---

## Bullet 7: Module wiring

**Scope:** `server/src/invite-codes/invite-codes.module.ts`, `server/src/app.module.ts`

**InviteCodesModule:**
```typescript
@Module({
  imports: [AuthModule],  // needs UserRepository for redeem (usedBy email lookup)
  controllers: [InviteCodesController],
  providers: [
    GenerateCodeHandler,
    DeleteCodeHandler,
    RedeemCodeHandler,
    GetInviteCodesHandler,
    InviteCodeResponseMapper,
    createRepositoryProvider(
      INVITE_CODE_REPOSITORY,
      PostgresInviteCodeRepository,
      InMemoryInviteCodeRepository,
    ),
  ],
  exports: [RedeemCodeHandler, INVITE_CODE_REPOSITORY],
})
export class InviteCodesModule {}
```

**AppModule:** Add `InviteCodesModule` to imports.

**AuthModule:** Import `InviteCodesModule` (for RedeemCodeHandler in register flow). Handle circular dependency via forwardRef if needed.

**Gate:** App starts without errors. All DI resolved.

---

## Bullet 8: Admin controller for users (presentation)

**Scope:** `server/src/user-settings/presentation/admin-users.controller.ts`

**Create separate controller** (keeps user-settings controller clean):
```
server/src/user-settings/presentation/
  admin-users.controller.ts
  admin-users.controller.spec.ts
  dto/
    block-user.dto.ts
```

**All endpoints prefixed `/api/admin/users`**, all guarded `@Roles('Superuser')`.

**Gate:** Spec tests: list users, block, unblock, delete. 403 for Member role.

---

## Bullet 9: Tests + quality gate

**Steps:**
1. Domain: InviteCode entity tests (create, redeem, expire, double-redeem)
2. Application: handler tests (generate, delete, redeem, get-all-users, block)
3. Presentation: controller specs (HTTP contract, auth, Zod validation)
4. Integration: registration with invite code (mode=invite-only)
5. `tsc --noEmit` — zero errors
6. `JWT_SECRET=ci-test npx jest --passWithNoTests` — all pass

**Gate:** All green. No regressions on existing 250+ tests.

---

## Environment Variables (new)

```env
# Registration mode: 'open' (anyone can register) or 'invite-only' (requires valid invite code)
REGISTRATION_MODE=invite-only
```

Add to `server/.env.example`.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Admin prefix | `/api/admin/*` | Clear separation. Easy to add middleware/logging later. |
| Block mechanism | Role → 'Blocked' + tokenVersion++ | JwtAuthGuard checks role. Token invalidated immediately. |
| Invite code format | 8-char uppercase alphanumeric | Short, readable, shareable via message. No ambiguous chars (0/O, 1/l). |
| Code expiry | Optional | Admin can set expiry or leave permanent. |
| Self-protection | Cannot block/delete own account | Prevents admin lockout. |
| Circular dep (Auth ↔ InviteCodes) | forwardRef or RedeemCodeHandler exported | RegisterHandler needs RedeemCode. Invite needs UserRepo. |

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1 (Domain entity) | 30 min |
| 2 (Infrastructure repos + schema) | 45 min |
| 3 (Application handlers) | 1h |
| 4 (InviteCodes controller) | 45 min |
| 5 (Registration invite-only mode) | 45 min |
| 6 (Admin users handlers) | 1h |
| 7 (Module wiring) | 20 min |
| 8 (Admin users controller) | 45 min |
| 9 (Tests) | 1h |
| **Total** | **~7.5 hours** |
