# Tier 2 BE — ABAC Enforcement — ✅ COMPLETE

> **Completed:** 2026-08-20. Option B chosen: document exception + minimal wire-up.

## Context

The implementation began with these verified conditions:

- `Permission` entity created at registration with full workspace access
- `PermissionRepository.hasPermission()` existed but nothing called it at runtime
- Workspace isolation already enforced via `workspaceId` from JWT claims (Tier 1 fix)
- MVP is single-user-per-workspace — no multi-user scenario exists yet

## Decision

**Option B** — Document ARCH-EXCEPTION + create inactive guard infrastructure. NOT full enforcement (no value until multi-user), NOT removal (preserves foundation).

## Delivered

| #   | Bullet                                                 | Status  |
| --- | ------------------------------------------------------ | ------- |
| 1   | ARCH-EXCEPTION comment in `auth.module.ts`             | ✅ Done |
| 2   | `PermissionGuard` — inactive, ready for Phase 5        | ✅ Done |
| 3   | `RequirePermission` decorator + exports + 5 unit tests | ✅ Done |

### Implementation details

- **ARCH-EXCEPTION** in `auth.module.ts` documents why ABAC is deferred (single-user workspace, JWT workspace isolation sufficient for MVP)
- **PermissionGuard** (`presentation/guards/permission.guard.ts`):
  - Uses `getAllAndOverride` + `Reflector` for metadata lookup
  - Injected `PermissionRepository` via DI token
  - Guard clause rejects non-workspace resource types with `ForbiddenException` (fails loudly until Phase 5 extends)
  - NOT registered as `APP_GUARD` — intentionally inactive
- **RequirePermission** decorator (`presentation/decorators/require-permission.decorator.ts`):
  - Owns `REQUIRED_PERMISSION_KEY` metadata key (consistent with `roles.decorator.ts` pattern)
  - Typed `RequiredPermission` interface (`resourceType` + `action`)
- Guard registered in `AuthModule` providers + exports (available for per-endpoint `@UseGuards()` when needed)
- Phase 5 plan updated: bullet #29 tracks PermissionGuard activation

### Tests

5 unit tests in `guards.spec.ts`:

1. Returns true when no `@RequirePermission` metadata present
2. Returns true when user has required permission
3. Throws `ForbiddenException` when user lacks permission
4. Throws `ForbiddenException` when no user on request
5. Throws `ForbiddenException` for non-workspace resource types

**Verification:** `tsc --noEmit` clean, 26 test suites, 234 tests pass.

## Files changed

- `server/src/auth/auth.module.ts` — ARCH-EXCEPTION comment + PermissionGuard provider/export
- `server/src/auth/presentation/guards/permission.guard.ts` (new)
- `server/src/auth/presentation/decorators/require-permission.decorator.ts` (new)
- `server/src/auth/presentation/guards/guards.spec.ts` — 5 new PermissionGuard tests
- `docs/plans/deferred/phase-5-admin-maintenance.md` — bullet #29 added

## Activation path (Phase 5)

When multi-user workspace feature lands:

1. Register `PermissionGuard` as `APP_GUARD` or apply via `@UseGuards(PermissionGuard)` on resource endpoints
2. Extend `RequiredPermission` to support `sub_budget` and `account` resource types with request-param-based resourceId resolution
3. Add member invite flow + granular permission assignment

## Related

- Sprint plan: [sprint-next-priorities.md](./sprint-next-priorities.md) task 2.3
- Phase 5 tracking: [phase-5-admin-maintenance.md](../deferred/phase-5-admin-maintenance.md) bullet #29
- Auth module guide: [auth-module.md](../../guides/backend/auth-module.md)
- Original ABAC design: [Phase 2.5](./phase-2-5-auth-abac.md)
