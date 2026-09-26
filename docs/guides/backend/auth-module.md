# Auth Module — Developer Guide

> ⚠️ **WIP:** Refresh token revocation, account lockout, and multi-workspace user switching are planned but not yet implemented. See Limitations section.

## Domain Context

Users need authenticated access to their workspace data. The auth module handles registration (create workspace + user + permission in one atomic operation), login (validate credentials → issue JWT pair), and token refresh. All other modules rely on guards provided by this module to extract the authenticated user.

---

## Architecture & Layers

```
src/auth/
├── domain/
│   ├── user.entity.ts                 # Email, passwordHash, role, workspaceId + invariants
│   ├── user-role.enum.ts              # Superuser | Member | Blocked
│   ├── permission.entity.ts           # ABAC: userId × resourceType × resourceId × actions[]
│   └── ports/
│       ├── user.repository.ts         # findByEmail, existsByEmail (globally unique)
│       ├── permission.repository.ts   # findByUserId
│       ├── token.port.ts              # sign/verify access + refresh tokens
│       └── password-hasher.port.ts    # hash/compare
│
├── application/
│   ├── commands/
│   │   ├── register.handler.ts        # Invite code claim → workspace → user → permission (atomic)
│   │   ├── login.handler.ts           # Validates credentials, rejects Blocked users, returns JWT pair
│   │   └── refresh.handler.ts         # Token rotation (new access + refresh)
│   └── dto/
│       └── auth-result.dto.ts         # { accessToken, refreshToken, user }
│
├── infrastructure/
│   ├── in-memory-user.repository.ts
│   ├── in-memory-permission.repository.ts
│   ├── jwt-token.adapter.ts           # @nestjs/jwt wrapper (15m access, 7d refresh)
│   └── bcrypt-password-hasher.adapter.ts
│
└── presentation/
    ├── auth.controller.ts             # register/login/refresh (all @Public())
    ├── auth.dto.ts                    # Zod schemas (email, password min 8)
    ├── guards/
    │   ├── jwt-auth.guard.ts          # Global (APP_GUARD), respects @Public()
    │   ├── roles.guard.ts             # Global (APP_GUARD), respects @Roles()
    │   └── permission.guard.ts        # Per-endpoint (NOT global), checks ABAC Permission
    └── decorators/
        ├── public.decorator.ts        # Bypass JWT guard
        ├── roles.decorator.ts         # @Roles(UserRole.Superuser)
        ├── require-permission.decorator.ts  # @RequirePermission({ resourceType, action })
        └── current-user.decorator.ts  # Extracts { userId, workspaceId, role } from JWT
```

---

## Public API

### Exported from AuthModule
- `JwtAuthGuard` — global guard (APP_GUARD in AppModule), rejects Blocked users
- `RolesGuard` — global guard (APP_GUARD in AppModule)
- `PermissionGuard` — per-endpoint guard (NOT global, inactive until Phase 5)
- `USER_REPOSITORY`, `TOKEN_PORT`, `PERMISSION_REPOSITORY`, `PASSWORD_HASHER` — DI tokens

### HTTP Endpoints (all `@Public()` — no auth required)

| Method | Path | Rate Limit | Description |
|--------|------|-----------|-------------|
| `POST /auth/register` | 5/min | Create workspace + user + permission (invite code required in invite-only mode) |
| `POST /auth/login` | 5/min | Validate credentials → JWT pair |
| `POST /auth/refresh` | 10/min | Rotate tokens (new access + refresh) |

### JWT Claims
```typescript
{ sub: userId, workspaceId: string, role: UserRole, tokenVersion: number }
```
All controllers access via `@CurrentUser()` decorator → `CurrentUserPayload`.

---

## Extension Points

### Adding a new guard
1. Create in `presentation/guards/`
2. Implement `CanActivate` interface
3. Register as `APP_GUARD` in AppModule or use `@UseGuards()` per controller

### Activating PermissionGuard on an endpoint (Phase 5+)
```typescript
@UseGuards(PermissionGuard)
@RequirePermission({ resourceType: 'workspace', action: 'write' })
@Post()
async create(...) { ... }
```
Currently only `'workspace'` resource type is supported. Non-workspace resource types throw `ForbiddenException` until Phase 5 extends the guard with sub-resource resolution.

### Switching to PostgreSQL user storage
1. Create `infrastructure/postgres-user.repository.ts` implementing `UserRepository`
2. Swap `useClass` in `auth.module.ts`
3. Add refresh token table for revocation (DEC-023 planned resolution)

### Adding OAuth (Google, GitHub)
1. New handler in `application/commands/oauth-login.handler.ts`
2. Uses same `TokenPort` to issue JWT pair
3. New endpoint `POST /auth/oauth/:provider`
4. User entity needs optional `oauthProvider` + `oauthId` fields

---

## Boundaries & Non-Goals

**Does:** Register, login, refresh, JWT issuance, global guards, workspace auto-creation
**Does NOT:**
- Password reset / email verification (planned post-MVP)
- Refresh token revocation / blacklist (planned — DEC-023)
- Multi-workspace user switching (planned — DEC-020 future)
- OAuth / social login (post-MVP)
- Granular ABAC permission checks per request (MVP: workspace-level only)
- Account lockout after failed attempts (planned — throttle exists, lockout doesn't)

---

## Trade-offs

> References: DEC-016 (JWT only initially), DEC-017 (ABAC workspace-level MVP), DEC-019 (auto workspace), DEC-020 (workspaceId in JWT), DEC-021 (email globally unique), DEC-022 (refresh in body not cookie), DEC-023 (no revocation MVP)

### Key decisions summary
- **JWT 15m + refresh 7d** — short-lived access, long-lived refresh without revocation (MVP tradeoff)
- **Refresh token in JSON body** (not httpOnly cookie) — API-first, easier testing, XSS risk accepted on MVP
- **Workspace auto-created at registration** — zero friction, eliminates "user without workspace" invalid state
- **Email globally unique** (not workspace-scoped) — standard SaaS pattern, login = email + password

---

## Limitations (WIP)

| Feature | Status | Impact |
|---------|--------|--------|
| Refresh token revocation | ❌ Not implemented | Leaked token valid for 7 days |
| Account lockout | ❌ Not implemented | Only rate limiting (5/min) exists |
| Password reset | ❌ Not implemented | No "forgot password" flow |
| Email verification | ❌ Not implemented | Any email accepted at registration |
| Granular ABAC checks | 🟡 Infrastructure ready, not active | `PermissionGuard` + `@RequirePermission` exist but are not applied to endpoints. ARCH-EXCEPTION documented. Activation planned for Phase 5 when multi-user lands. |
| Multi-workspace | ❌ Not implemented | One user = one workspace |
| Logout (token invalidation) | ❌ Not implemented | Token valid until expiry |

---

## Testing Strategy

```bash
cd server && npx jest --testPathPattern=auth --verbose
```

| File | Tests |
|------|-------|
| `domain/user.entity.spec.ts` | 9 — invariants, factory, isSuperuser |
| `domain/permission.entity.spec.ts` | 9 — invariants, hasAction |
| `presentation/auth.controller.spec.ts` | 8 — register/login/refresh integration |
| `presentation/guards/*.spec.ts` | 12 — JWT validation, @Public bypass, @Roles, PermissionGuard (5) |

---

*Generated: 2026-07-02 | Source: `server/src/auth/`*
