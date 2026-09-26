# Devplan: Admin Panel

## Context

SaaS admin capabilities needed before inviting beta users. Must be able to: see who registered, manage access, generate invite codes, manage dictionaries.

**Architecture:** Admin features guarded by `role: 'Superuser'` (already exists on User entity). No separate admin app — routes under `/admin/*` in existing React app, guarded by role check.

**Existing infrastructure:**
- `UserRole.Superuser` enum value exists
- `User.isSuperuser()` method exists
- `RolesGuard` exists (registered globally)
- `Permission` entity exists
- Backend already has user CRUD (findById, findByEmail, delete)

---

## Bullet 1: Backend — Invite codes module

**Scope:** `server/src/invite-codes/`

**What:**
- Entity: `InviteCode { id, code, createdBy, usedBy?, usedAt?, expiresAt?, createdAt }`
- Endpoints:
  - `POST /api/admin/invite-codes` — generate new code (Superuser only)
  - `GET /api/admin/invite-codes` — list all codes with usage status
  - `DELETE /api/admin/invite-codes/:id` — revoke unused code
- Registration flow: `POST /api/auth/register` accepts optional `inviteCode` field
- When invite-only mode enabled: registration WITHOUT valid code → 403

**Config:** `REGISTRATION_MODE=open|invite-only` env var (default: `invite-only`)

**Gate:** Tests pass. Registration with/without code works per mode.

---

## Bullet 2: Backend — Admin users endpoint

**Scope:** `server/src/user-settings/` (extend existing module)

**What:**
- `GET /api/admin/users` — list all users (Superuser only): id, email, role, createdAt, workspaceId, hasVault
- `PATCH /api/admin/users/:id/block` — block user (set role to 'Blocked')
- `DELETE /api/admin/users/:id` — delete user + workspace + data

**Guard:** `@Roles('Superuser')` decorator on all admin endpoints.

**Gate:** 403 for non-superuser. List returns correct data.

---

## Bullet 3: Backend — Admin dictionaries endpoints (already done in devplan-dictionary-api-be.md)

This is already planned. Admin panel UI just calls existing write endpoints (`POST /api/dictionaries`, `DELETE /api/dictionaries/:id`).

No backend work needed — just frontend UI (Bullet 6).

---

## Bullet 4: Frontend — Admin layout + routing

**Scope:** `client/src/pages/admin/`, `client/src/app/routing/`

**What:**
- New routes: `/admin`, `/admin/users`, `/admin/invite-codes`, `/admin/dictionaries`
- Admin layout (reuse AppShell, add admin sidebar section)
- Route guard: redirect non-superuser to `/dashboard`
- Sidebar: show "Admin" section only for Superuser role

**Gate:** Non-admin cannot access `/admin/*`. Admin sees admin nav items.

---

## Bullet 5: Frontend — Users management page

**Scope:** `client/src/features/admin-users/` (new feature)

**What:**
- Table: email, role, created date, has vault backup, actions
- Actions: Block/Unblock, Delete (with confirmation modal)
- Simple DataGrid or plain table (no AG Grid needed for ~20 users)

**Gate:** Page renders user list. Block/delete work with confirmation.

---

## Bullet 6: Frontend — Invite codes page

**Scope:** `client/src/features/admin-invite-codes/` (new feature)

**What:**
- "Generate code" button → creates new invite code → shows copyable code
- Table: code, created date, used by (email or "unused"), actions
- Copy to clipboard button
- Delete unused codes

**Gate:** Can generate, copy, and share invite codes.

---

## Bullet 7: Frontend — Dictionaries management page

**Scope:** `client/src/features/admin-dictionaries/` (new feature)

**What:**
- Tab per dictionary type (Names, Surnames, Cities, Merchants, Phrases)
- Table with entries + delete button
- "Add entry" form (input + type select)
- "Bulk import" textarea (one per line)

**Gate:** CRUD on dictionaries works. Changes reflected on next CSV import.

---

## Bullet 8: Tests + quality gate

**Steps:**
1. Backend: controller specs for admin endpoints (auth guard, 403 for non-admin)
2. Frontend: basic render tests for admin pages
3. `tsc --noEmit` clean (server + client)
4. All tests pass

**Gate:** All green.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Separate admin app? | **No** | Same SPA, route-guarded. Simple for MVP. Split later if needed. |
| Admin role? | **Existing Superuser** | Already in User entity. No new concept needed. |
| Invite code format? | **8-char alphanumeric** | Short enough to share via message. `crypto.randomUUID().slice(0,8)` |
| Block mechanism? | **Role change to 'Blocked'** | JwtAuthGuard checks role on every request. Blocked = can't get new tokens. |
| Registration mode? | **Env var** | Easy flip without code change. `invite-only` for beta, `open` for launch. |

---

## Estimated Effort

| Bullet | Effort |
|--------|--------|
| 1 | 2h |
| 2 | 1h |
| 3 | — (done in dictionary devplan) |
| 4 | 1h |
| 5 | 1.5h |
| 6 | 1.5h |
| 7 | 1.5h |
| 8 | 30 min |
| **Total** | **~9 hours** |
