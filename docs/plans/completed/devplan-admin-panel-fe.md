# Devplan FE: Admin Panel

## Context

Admin panel for Superuser role. Manages users, invite codes and dictionaries. The
original local design brief was an implementation input and is not retained in the
public tree; implemented behavior and maintained guidance live in the product and
frontend documentation.

**Architecture:** FSD. New feature `features/admin/` (or split: `features/admin-users/`, `features/admin-invite-codes/`, `features/admin-dictionaries/`). Reuses existing AppShell layout + Sidebar. API calls to backend admin endpoints.

**Key constraint:** Desktop = no scrolling (fits 1280×800). Mobile = responsive with normal scroll.

**Prerequisites:** Backend admin endpoints done (devplan-admin-panel.md bullets 1-2).

---

## Bullet 1: Routing + Layout + Role Guard

**Scope:** `client/src/app/routing/`, `client/src/pages/`

**Create:**

```
pages/
  AdminPage/
    AdminPage.tsx           ← Tab container (Dashboard | Users | Invite Codes | Dictionaries)
    index.ts
```

**Steps:**

1. Add route `/admin` in routing config (protected, requires auth)
2. Add `AdminPage` component with Tabs (reuse `shared/ui/Tabs` or new)
3. Add role guard: if user.role !== 'Superuser' → redirect to `/dashboard`
4. Add "Admin" nav item in Sidebar (visible only for Superuser)
5. i18n keys for tab labels

**Gate:** Non-admin navigating to `/admin` gets redirected. Admin sees page with 4 tabs.

---

## Bullet 2: API layer — admin hooks

**Scope:** `client/src/features/admin/api/`

**Create:**

```
features/admin/api/
  useAdminUsersQuery/
    useAdminUsersQuery.ts
    index.ts
  useInviteCodesQuery/
    useInviteCodesQuery.ts
    index.ts
  useGenerateCodeMutation/
    useGenerateCodeMutation.ts
    index.ts
  useBlockUserMutation/
    useBlockUserMutation.ts
    index.ts
  useDeleteUserMutation/
    useDeleteUserMutation.ts
    index.ts
  useDeleteInviteCodeMutation/
    useDeleteInviteCodeMutation.ts
    index.ts
  index.ts
```

**Endpoints consumed:**

- `GET /api/admin/users` → list users
- `PATCH /api/admin/users/:id/block` → block/unblock
- `DELETE /api/admin/users/:id` → delete user
- `GET /api/admin/invite-codes` → list codes
- `POST /api/admin/invite-codes` → generate code
- `DELETE /api/admin/invite-codes/:id` → revoke code

**Dictionaries API:** Already exists (`GET/POST/DELETE /api/dictionaries`) — reuse from csv-import or create thin admin wrapper.

**Gate:** All hooks typed, `tsc --noEmit` clean.

---

## Bullet 3: Model layer — types + ViewModels

**Scope:** `client/src/features/admin/model/`

**Create:**

```
features/admin/model/
  types.ts
  index.ts
```

**Types:**

```typescript
interface AdminUserViewModel {
  readonly id: string;
  readonly email: string;
  readonly role: "Member" | "Superuser" | "Blocked";
  readonly createdAt: string;
  readonly hasVault: boolean;
}

interface InviteCodeViewModel {
  readonly id: string;
  readonly code: string;
  readonly status: "available" | "used" | "expired";
  readonly createdAt: string;
  readonly usedBy?: string; // email
  readonly usedAt?: string;
}

interface AdminDashboardStats {
  readonly totalUsers: number;
  readonly activeToday: number;
  readonly blockedCount: number;
  readonly availableCodes: number;
  readonly usedCodes: number;
}
```

**Gate:** Types exported from index.

---

## Bullet 4: UI — Admin Dashboard tab (3-panel overview)

**Scope:** `client/src/features/admin/ui/AdminDashboard/`

**Create:**

```
features/admin/ui/
  AdminDashboard/
    AdminDashboard.tsx
    index.ts
  UsersOverviewPanel/
    UsersOverviewPanel.tsx
    index.ts
  InviteCodesPanel/
    InviteCodesPanel.tsx
    index.ts
  DictionariesPanel/
    DictionariesPanel.tsx
    index.ts
  hooks/
    useAdminDashboard/
      useAdminDashboard.ts
      index.ts
```

**Layout (desktop):** 3-column grid (`grid-cols-3 gap-4`), each panel is a Card.

**UsersOverviewPanel:**

- Stats row (3 mini badges: total, active, blocked)
- Compact table: last 5 users (email, role badge, date)
- "View all →" link (switches to Users tab)

**InviteCodesPanel:**

- "Generate Code" Button (primary)
- Last 5 codes: code (mono, truncated), status badge
- Stats: X available / Y used

**DictionariesPanel:**

- List: type name + count badge per row (Names: 2000, Surnames: 5000, etc.)
- "Manage →" link per type (switches to Dictionaries tab)

**Gate:** Dashboard renders without scroll on 1280×800. All 3 panels visible.

---

## Bullet 5: UI — Users management tab

**Scope:** `client/src/features/admin/ui/UsersTab/`

**Create:**

```
features/admin/ui/
  UsersTab/
    UsersTab.tsx
    index.ts
  UserRow/
    UserRow.tsx
    index.ts
  hooks/
    useUsersTab/
      useUsersTab.ts
      index.ts
```

**Layout:**

- Top: search Input (filter by email) + stats text ("12 users")
- Table: Email | Role (badge) | Registered | Vault (✓/—) | Actions (icon buttons)
- Pagination: compact (max 8 rows per page)
- Actions: Block/Unblock (toggle), Delete (opens confirmation modal)

**useUsersTab hook:**

- Consumes `useAdminUsersQuery`
- Manages: search filter, pagination, delete confirmation state
- Returns: filtered users, pagination info, handlers

**Gate:** Table renders. Block/delete work with confirmation. Fits viewport.

---

## Bullet 6: UI — Invite Codes tab

**Scope:** `client/src/features/admin/ui/InviteCodesTab/`

**Create:**

```
features/admin/ui/
  InviteCodesTab/
    InviteCodesTab.tsx
    index.ts
  GeneratedCodeDisplay/
    GeneratedCodeDisplay.tsx
    index.ts
  hooks/
    useInviteCodesTab/
      useInviteCodesTab.ts
      index.ts
```

**Layout (split view):**

- Left (1/3): "Generate" button + generated code display (large mono + copy icon)
- Right (2/3): table of codes (code, status badge, created, used by, delete action)

**GeneratedCodeDisplay:**

- Shows generated code in large monospace font
- Copy to clipboard button (copies to clipboard + shows toast "Copied!")
- Disappears after generating next code

**useInviteCodesTab hook:**

- Consumes `useInviteCodesQuery`, `useGenerateCodeMutation`, `useDeleteInviteCodeMutation`
- Manages: last generated code state, copy handler
- Returns: codes list, handlers, generatedCode

**Gate:** Generate → code appears → copy works → code shows in table. Delete removes unused.

---

## Bullet 7: UI — Dictionaries management tab

**Scope:** `client/src/features/admin/ui/DictionariesTab/`

**Create:**

```
features/admin/ui/
  DictionariesTab/
    DictionariesTab.tsx
    index.ts
  DictionaryTypeView/
    DictionaryTypeView.tsx
    index.ts
  AddEntryModal/
    AddEntryModal.tsx
    index.ts
  BulkImportModal/
    BulkImportModal.tsx
    index.ts
  hooks/
    useDictionariesTab/
      useDictionariesTab.ts
      index.ts
```

**Layout:**

- Sub-tabs: Names | Surnames | Cities | Merchants | Phrases
- Per type view (DictionaryTypeView):
  - Stats bar: "5,231 entries · Last updated 2h ago"
  - Buttons: "+ Add Entry" | "Bulk Import"
  - Search input (filter locally)
  - Compact table: Value | Added date | Delete icon
  - Pagination (8 rows per page)

**AddEntryModal:**

- Input: value (string)
- Type pre-selected (from which sub-tab user clicked)
- Submit → POST /api/dictionaries → refetch → close + toast

**BulkImportModal:**

- Textarea: one entry per line
- Preview: "X entries will be imported"
- Submit → POST /api/dictionaries/bulk → refetch → close + toast with count

**Gate:** CRUD works per type. Search filters locally. Bulk import shows count.

---

## Bullet 8: Modals — Delete confirmation (shared)

**Scope:** `client/src/features/admin/ui/ConfirmDeleteModal/`

**Reusable confirmation modal:**

- Title: "Delete {entity}?"
- Body: descriptive warning (user: "This will permanently delete account and vault", code: "This will revoke the invite code")
- Actions: "Cancel" (secondary) | "Delete" (destructive/red)

**Used by:** Users tab (delete user), Invite codes tab (delete code), Dictionaries tab (delete entry).

**Gate:** Modal opens with correct context. Cancel closes. Confirm triggers mutation.

---

## Bullet 9: i18n + responsive + polish

**Steps:**

1. Add all admin panel strings to `pl.json` and `en.json`
2. Verify mobile layout: panels stack, tables become cards, touch targets 44px+
3. Verify desktop no-scroll on 1280×800
4. Add loading skeletons on data fetch
5. Add empty states ("No users yet", "No codes generated")

**Gate:** Full i18n coverage. Mobile usable. Desktop no-scroll. Loading/empty states present.

---

## Bullet 10: Tests + quality gate

**Steps:**

1. `tsc --noEmit` clean
2. Hook tests: useUsersTab, useInviteCodesTab (mock API, verify state logic)
3. Render tests: AdminDashboard, UsersTab, InviteCodesTab, DictionariesTab (render without crash)
4. No existing tests broken
5. Verify role guard (non-admin redirect)

**Gate:** All green. `vitest run` passes.

---

## File Structure Summary

```
client/src/
  features/admin/
    model/
      types.ts
      index.ts
    api/
      useAdminUsersQuery/
      useInviteCodesQuery/
      useGenerateCodeMutation/
      useBlockUserMutation/
      useDeleteUserMutation/
      useDeleteInviteCodeMutation/
      index.ts
    ui/
      AdminDashboard/
      UsersOverviewPanel/
      InviteCodesPanel/
      DictionariesPanel/
      UsersTab/
      UserRow/
      InviteCodesTab/
      GeneratedCodeDisplay/
      DictionariesTab/
      DictionaryTypeView/
      AddEntryModal/
      BulkImportModal/
      ConfirmDeleteModal/
      hooks/
        useAdminDashboard/
        useUsersTab/
        useInviteCodesTab/
        useDictionariesTab/
    index.ts
  pages/
    AdminPage/
```

---

## Estimated Effort

| Bullet                | Effort       |
| --------------------- | ------------ |
| 1 (Routing + guard)   | 30 min       |
| 2 (API hooks)         | 45 min       |
| 3 (Model types)       | 15 min       |
| 4 (Dashboard tab)     | 1h           |
| 5 (Users tab)         | 1h           |
| 6 (Invite codes tab)  | 1h           |
| 7 (Dictionaries tab)  | 1.5h         |
| 8 (Delete modal)      | 20 min       |
| 9 (i18n + responsive) | 45 min       |
| 10 (Tests)            | 45 min       |
| **Total**             | **~8 hours** |
