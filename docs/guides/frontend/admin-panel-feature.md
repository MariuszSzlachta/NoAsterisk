# Admin Panel Feature — Developer Guide

## Domain Context

The admin panel provides workspace-level administration: user management (block/delete), invite code generation, and anonymization dictionary management. Access is restricted to Superuser role via route-level guard. The feature uses TanStack Query for server state with no local store (Zustand) — each tab manages its own concerns via dedicated hooks.

---

## Architecture

```
features/admin/
├── index.ts                        # Public API
├── model/
│   ├── types.ts                    # ViewModels, type literals
│   └── index.ts                    # Model barrel
├── api/
│   ├── useAdminUsersQuery/         # GET /admin/users
│   ├── useInviteCodesQuery/        # GET /admin/invite-codes
│   ├── useBlockUserMutation/       # PATCH /admin/users/:id/block
│   ├── useDeleteUserMutation/      # DELETE /admin/users/:id
│   ├── useGenerateCodeMutation/    # POST /admin/invite-codes
│   ├── useDeleteInviteCodeMutation/ # DELETE /admin/invite-codes/:id
│   └── index.ts                    # API barrel
└── ui/
    ├── AdminDashboard/             # 3-panel overview (compose panels)
    ├── UsersOverviewPanel/         # Stats + recent users card
    ├── InviteCodesPanel/           # Stats + recent codes card
    ├── DictionariesPanel/          # Dictionary type list card
    ├── UsersTab/                   # Full users table + CRUD
    ├── UserRow/                    # Single table row component
    ├── InviteCodesTab/             # Generate panel + codes table
    ├── InviteCodeRow/              # Single code table row
    ├── DictionariesTab/            # Sub-tabs + card grid
    ├── DictionaryEntryCard/        # Single entry card
    ├── ConfirmDeleteModal/         # Reusable delete confirmation
    └── hooks/
        ├── useAdminDashboard/      # Dashboard data aggregation
        ├── useUsersTab/            # Users table logic + pagination
        ├── useUserRowActions/      # Per-row block/delete handlers
        ├── useInviteCodesTab/      # Codes generation + list
        └── useDictionariesTab/     # Sub-tab switching + mock data
```

Page: `client/src/pages/AdminPage/AdminPage.tsx`
Route guard: `client/src/app/routing/RequireRole/RequireRole.tsx`

---

## Public API

```typescript
// features/admin/index.ts

// API Layer
export { useAdminUsersQuery } from './api/useAdminUsersQuery';
export { useBlockUserMutation } from './api/useBlockUserMutation';
export { useDeleteInviteCodeMutation } from './api/useDeleteInviteCodeMutation';
export { useDeleteUserMutation } from './api/useDeleteUserMutation';
export { useGenerateCodeMutation } from './api/useGenerateCodeMutation';
export { useInviteCodesQuery } from './api/useInviteCodesQuery';

// Model Layer
export type {
  AdminDashboardStats, AdminUserRole, AdminUserViewModel,
  DictionaryEntryViewModel, DictionaryType, DictionaryTypeInfo,
  InviteCodeStatus, InviteCodeViewModel,
} from './model/types';

// UI Layer
export { AdminDashboard } from './ui/AdminDashboard';
export { DictionariesTab } from './ui/DictionariesTab';
export { InviteCodesTab } from './ui/InviteCodesTab';
export { UsersTab } from './ui/UsersTab';
```

---

## Routing & Access Control

### RequireRole guard

```typescript
// app/routing/RequireRole/RequireRole.tsx
export const RequireRole = ({ role }: { role: UserRole }): React.JSX.Element => {
  const { data, isLoading } = useProfileQuery();
  if (isLoading) return <div />;
  if (!data || data.role !== role) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
```

Design decisions:
- **Route layout element**, not per-component check — wraps `<Outlet />` so children render only if role matches.
- Uses existing `useProfileQuery` from `#features/user-settings`.
- Redirects unauthorized users to `/dashboard` silently.
- Renders empty `<div />` during loading (prevents flash of redirect).

Route registration:

```typescript
// app/routing/routes.tsx
{
  element: <RequireRole role="Superuser" />,
  children: [
    { path: '/admin', element: <AdminPage /> },
  ],
}
```

---

## Data Flow

### Overview tab (AdminDashboard)

```
useAdminDashboard hook
  → useAdminUsersQuery (GET /admin/users)
  → useInviteCodesQuery (GET /admin/invite-codes)
  → derives: stats (totals, counts), recentUsers (first 5), recentCodes (first 5)
  → dictionaryItems (mock data — TODO: real API)
  ↓
AdminDashboard composes 3 panels:
  → UsersOverviewPanel (stats + recent users)
  → InviteCodesPanel (stats + recent codes + generate shortcut)
  → DictionariesPanel (type list + manage buttons)
```

### Users tab

```
useUsersTab hook
  → useAdminUsersQuery (server state)
  → useBlockUserMutation + useDeleteUserMutation
  → local state: searchQuery, currentPage, deleteTarget
  → derives: filtered users, pagination
  ↓
UsersTab renders:
  → Search input + total count
  → Table → UserRow per user (each uses useUserRowActions)
  → Pagination controls
  → ConfirmDeleteModal (conditional on deleteTarget)
```

### Invite Codes tab

```
useInviteCodesTab hook
  → useInviteCodesQuery (server state)
  → useGenerateCodeMutation + useDeleteInviteCodeMutation
  → local state: generatedCode, expiryDate
  → maps DTO nulls → undefined for ViewModel compliance
  ↓
InviteCodesTab renders:
  → Left panel: generate form + last generated code (copy)
  → Right panel: codes table → InviteCodeRow per code
```

### Dictionaries tab

```
useDictionariesTab hook
  → local state: activeType, searchQuery, currentPage, modal flags
  → mock data (backend in development)
  → derives: sub-tabs with counts, paginated entries, displayRange
  ↓
DictionariesTab renders:
  → FilterTabs (sub-navigation between dictionary types)
  → Header with search + Add/Bulk Import buttons
  → Card grid (3 columns) → DictionaryEntryCard per entry
  → Pagination controls
```

---

## State Management

**No Zustand store.** All state lives in:

| Concern | Location | Mechanism |
|---------|----------|-----------|
| Server data (users, codes) | `api/` hooks | TanStack Query (`useApiQuery`) |
| Search, pagination, modals | `ui/hooks/` | React `useState` (per-tab) |
| Delete confirmation state | `useUsersTab` | `deleteTarget: AdminUserViewModel \| undefined` |
| Generated code display | `useInviteCodesTab` | `generatedCode: string \| undefined` |
| Dictionary sub-tab | `useDictionariesTab` | `activeType: DictionaryType` |
| Tab navigation | `useAdminTabs` (page) | `activeTab: AdminTabId` |

Rationale: Each tab is independent. No shared state crosses tab boundaries. TanStack Query handles caching and refetching. Local `useState` is sufficient for UI-only transient state.

---

## Cache Invalidation

| Mutation | Invalidates query key |
|----------|----------------------|
| `useBlockUserMutation` | `['admin', 'users']` |
| `useDeleteUserMutation` | `['admin', 'users']` |
| `useGenerateCodeMutation` | `['admin', 'invite-codes']` |
| `useDeleteInviteCodeMutation` | `['admin', 'invite-codes']` |

Pattern: Every mutation's `onSuccess` calls `queryClient.invalidateQueries()` with the relevant key. No optimistic updates — mutations wait for server confirmation then refetch.

---

## Model Layer

### Types

| Type | Purpose |
|------|---------|
| `AdminUserRole` | `'Superuser' \| 'Member' \| 'Blocked'` — role literal |
| `AdminUserViewModel` | UI-ready user: id, email, role, createdAt, hasVault |
| `InviteCodeStatus` | `'Available' \| 'Used' \| 'Expired'` — code lifecycle |
| `InviteCodeViewModel` | UI-ready code: id, code, status, createdAt, expiresAt?, usedBy?, usedAt? |
| `AdminDashboardStats` | Aggregated stats: totalUsers, activeToday, blockedCount, availableCodes, usedCodes |
| `DictionaryType` | `'firstNames' \| 'surnames' \| 'cities' \| 'merchants' \| 'phrases'` |
| `DictionaryEntryViewModel` | Single entry: id, value, createdAt |
| `DictionaryTypeInfo` | Type metadata: type, count, lastUpdated |

Note: No `transformers.ts` file — DTOs are structurally identical to ViewModels for users. Only `InviteCodeViewModel` requires null → undefined mapping, done inline in `useInviteCodesTab`.

---

## API Endpoints

| Hook | Method | Endpoint | Response |
|------|--------|----------|----------|
| `useAdminUsersQuery` | GET | `/admin/users` | `{ users, total }` |
| `useInviteCodesQuery` | GET | `/admin/invite-codes` | `{ codes, total }` |
| `useBlockUserMutation` | PATCH | `/admin/users/:id/block` | `{ id, blocked }` |
| `useDeleteUserMutation` | DELETE | `/admin/users/:id` | `{ id, deleted }` |
| `useGenerateCodeMutation` | POST | `/admin/invite-codes` | `{ id, code, expiresAt? }` |
| `useDeleteInviteCodeMutation` | DELETE | `/admin/invite-codes/:id` | `{ id, deleted }` |

---

## UI Components

### AdminDashboard

3-column grid (`lg:grid-cols-3`) composing three overview panels. Shows `Skeleton` placeholders while loading. Passes `onNavigateToTab` to panels so "View All" / "Generate" / "Manage" buttons navigate to the corresponding tab.

### UsersTab

Full CRUD table with search (email filter, case-insensitive), client-side pagination (8 rows per page), block/unblock toggle, and delete with confirmation modal. Columns: email, role badge, registered date, vault status (check/X), actions.

### InviteCodesTab

Split layout: left card (generate form + last code + copy button + expiry date input) + right table (all codes with status badges). Only "Available" codes show delete button.

### DictionariesTab

FilterTabs for sub-navigation between 5 dictionary types (with entry counts). Card grid layout (3 columns) for entries. Search, pagination, and action buttons (Add Entry, Bulk Import) — currently wired to modals but modals are not yet rendered (open/close state managed, content TBD when backend delivers API).

### ConfirmDeleteModal

Reusable across tabs. Accessible: `role="dialog"`, `aria-modal`, `aria-labelledby`. Closes on Escape keypress and backdrop click. Takes `title`, `description`, `onConfirm`, `onCancel` props.

---

## Design System Reuse

| Component | Source | Usage |
|-----------|--------|-------|
| `FilterTabs` | `#shared/ui/FilterTabs` | Main tabs + dictionary sub-tabs |
| `Button` | `#shared/ui/Button` | All actions (ghost, secondary, destructive variants) |
| `Card`, `CardHeader` | `#shared/ui/Card` | Dashboard panels, invite code generate panel |
| `Input` | `#shared/ui/Input` | Search, date input |
| `Badge` | `#shared/ui/Badge` | Role badges, status badges |
| `Skeleton` | `#shared/ui/Skeleton` | Loading states |
| Icons | `lucide-react` | Shield, Plus, Copy, Upload, Ban, Check, X, Trash2 |

---

## Pagination

Client-side pagination in UsersTab and DictionariesTab:

- `PAGE_SIZE = 8` (users), `PAGE_SIZE = 21` (dictionaries — 3 cols × 7 rows)
- Search resets page to 1
- Sub-tab change resets page and search (dictionaries)

---

## i18n

All user-facing strings use `t('admin.*')` from react-i18next. Key namespaces:

| Namespace | Content |
|-----------|---------|
| `admin.pageTitle` | Page heading |
| `admin.tabs.*` | Tab labels (overview, users, codes, dictionaries) |
| `admin.users.*` | Users table labels, actions, search placeholder |
| `admin.codes.*` | Invite codes labels, actions |
| `admin.codeStatus.*` | Status badge labels (Available, Used, Expired) |
| `admin.roles.*` | Role labels (blocked) |
| `admin.dashboard.*` | Dashboard panel titles, stats labels, actions |
| `admin.dict.*` | Dictionary entries label, search, actions |
| `admin.dictTypes.*` | Dictionary type labels (firstNames, surnames, cities, merchants, phrases) |
| `admin.modal.*` | Confirmation modal buttons and messages |

---

## Test Coverage

Hook tests in `useUsersTab/useUsersTab.spec.ts` (7 test cases):

| Test | Asserts |
|------|---------|
| Returns all users on initial render | Length, totalUsers, isLoading |
| Filters users by search query | Case-insensitive email filter |
| Resets page to 1 on search | Page reset after query change |
| Sets deleteTarget on delete request | Target populated |
| Clears deleteTarget on cancel | Target cleared to undefined |
| Calls deleteUser and clears target on confirm | Mutation called with ID, target cleared |
| Calls toggleBlock with correct params | Block mutation called with userId + boolean |

Mocking strategy: `vi.mock('#features/admin')` provides loaded query state + mock mutation functions.

---

## Extension Points

### Connecting dictionaries to backend

When the dictionaries backend endpoint is ready:

1. Create `api/useDictionariesQuery/` — GET `/admin/dictionaries/:type`.
2. Create `api/useAddDictionaryEntryMutation/` — POST `/admin/dictionaries/:type`.
3. Create `api/useDeleteDictionaryEntryMutation/` — DELETE `/admin/dictionaries/:type/:id`.
4. Create `api/useBulkImportDictionaryMutation/` — POST `/admin/dictionaries/:type/bulk`.
5. Replace mock data in `useDictionariesTab` with query hooks.
6. Wire `handleOpenAdd`/`handleOpenBulk` to actual modal content with form submission.

### Adding new admin tabs

1. Add literal to `AdminTabId` in `useAdminTabs`.
2. Add `FilterTab` entry to the `tabs` array.
3. Create new tab component in `features/admin/ui/`.
4. Add branch in `renderTab()` in `useAdminTabs`.
5. Add i18n keys under `admin.tabs.*`.

### Adding role-based granularity

Currently binary: Superuser sees admin panel, others get redirected. To add finer control:

1. Extend `UserRole` type in `#features/user-settings`.
2. Modify `RequireRole` to accept `role: UserRole | UserRole[]`.
3. Add role checks per-tab if needed (currently all admin tabs require same role).

---

## Limitations

| Feature | Status |
|---------|--------|
| Dictionary CRUD | ⚠️ Mock data — backend in parallel development |
| Bulk dictionary import | ⚠️ UI button exists, modal content not implemented |
| User invite flow | ❌ Code generation only — no email sending |
| User editing (role change) | ❌ Only block/unblock — no role assignment UI |
| Audit log | ❌ Not implemented |
| Server-side pagination | ❌ Client-side only (acceptable for admin scale) |
| Optimistic updates | ❌ Mutations wait for confirmation then refetch |

---

## Related

- Backend module: [admin-panel-module](../backend/admin-panel-module.md)
- Auth feature: [auth-feature](./auth-feature.md) — token management used by API hooks
- User settings: [user-settings-feature](./user-settings-feature.md) — provides `useProfileQuery` for role check
- Dictionaries backend: [dictionaries-module](../backend/dictionaries-module.md)
- Legacy decision: [DEC-018](../../history/decisions/DEC-018-userrole-superuser-member-two-level.md) — two-level role system

---

*Updated: 2026-08-22 | Source: `client/src/features/admin/`, `client/src/pages/AdminPage/`, `client/src/app/routing/RequireRole/`*
