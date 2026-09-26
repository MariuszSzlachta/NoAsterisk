# Phase 2.5: Auth + ABAC (users, JWT, permissions) — ✅ COMPLETE

> **Source status:** The source heading explicitly marks this phase COMPLETE.

| # | Task | Status |
|---|---|---|
| A1 | User entity + repository (roles: Superuser/Member, password hash) | ✅ Done |
| A2 | Auth module — register + login + JWT (access 15m, refresh 7d) | ✅ Done |
| A3 | Guards + decorators (JwtAuthGuard, RolesGuard, @CurrentUser) | ✅ Done |
| A4 | Permission entity + repository (ABAC workspace-level) | ✅ Done |
| A5 | Wire guards into existing controllers (replace TEMP_WORKSPACE_ID) | ✅ Done |

### Implemented (Phase 2.5)

- `User` entity (email, passwordHash, role, workspaceId) + `UserRole` enum (Superuser/Member)
- `Workspace` entity in its own module `src/workspaces/` (bounded context)
- `Permission` entity (userId, resourceType, resourceId, actions[]) — ABAC
- `RegisterHandler` — creates workspace → user → permission (full workspace access)
- `LoginHandler` — validates credentials, returns JWT pair
- `RefreshHandler` — token rotation (new access + new refresh)
- `TokenPort` + `JwtTokenAdapter` (@nestjs/jwt), `PasswordHasherPort` + `BcryptPasswordHasher`
- `JwtAuthGuard` global (APP_GUARD) with `@Public()` bypass
- `RolesGuard` global (APP_GUARD) with typed `@Roles(UserRole)` decorator
- `@CurrentUser()` decorator — extracts userId/workspaceId/role from JWT
- Rate limiting: `@nestjs/throttler` (5/min auth, 10/min refresh, 30/min global)
- All controllers migrated from `TEMP_WORKSPACE_ID` to `@CurrentUser()`
- `AuthModule` exports guards/repos, imports `WorkspacesModule`

### Tests (Phase 2.5)

- 9 unit tests for User entity
- 6 unit tests for Workspace entity
- 9 unit tests for Permission entity
- 7 unit tests for RegisterHandler
- 4 unit tests for LoginHandler
- 3 unit tests for RefreshHandler
- 7 unit tests for Guards (JwtAuth + Roles + @Public)
- 8 integration tests for AuthController (register/login/refresh + validation)
- **Total project: 204/204 PASS, tsc --noEmit clean**

---

## Source provenance

- Original source: legacy development plan
- Pre-atomization path: `docs/plans/roadmap.md`
- Original source lines: 81–120
- Frozen source commit: `582b3e8b147293c7b33dd0f839839aa81d7c8c20`
