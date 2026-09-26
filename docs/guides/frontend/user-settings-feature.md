# User Settings Feature — Developer Guide

## Overview

The User Settings feature provides a full account management experience: profile editing, password change, application preferences, encrypted vault backup/restore, and account deletion. It is accessed via `/settings` (from the Sidebar UserMenu) and exposed as a `UserMenu` dropdown component in the Sidebar.

---

## Architecture

```
features/user-settings/
├── index.ts                     # Public API
├── model/
│   ├── types.ts                 # ProfileData, PreferencesValues, VaultInfo, etc.
│   ├── validators.ts            # Password + display name validation (OWASP)
│   ├── validators.spec.ts       # 32 test cases
│   └── vault-helpers.ts         # Pure functions: computeVaultStatus, formatSyncDate, estimateSizeKb
├── store/
│   └── usePreferencesStore/     # Zustand persist — currency, dateFormat, language, theme, homePage
├── api/
│   ├── useProfileQuery/         # GET /users/me
│   ├── useUpdateProfileMutation/# PATCH /users/me
│   ├── useChangePasswordMutation/ # POST /users/me/change-password
│   ├── useUpdatePreferencesMutation/ # PATCH /users/me/preferences
│   ├── useVaultQuery/           # GET /users/me/vault
│   ├── useUploadVaultMutation/  # POST /users/me/vault
│   ├── useLogoutMutation/       # POST /users/me/logout + clear tokens
│   └── useDeleteAccountMutation/ # POST /users/me/delete
└── ui/
    ├── ProfileSection/          # Display name edit
    ├── SecuritySection/         # Change password (live rule indicators)
    ├── PreferencesSection/      # Currency, date, language, theme, home page
    ├── VaultSection/            # Sync, export, import data
    ├── DangerSection/           # Clear data + delete account
    ├── ConfirmDialog/           # Generic confirmation dialog with optional fields
    ├── RestoreDialog/           # Vault restore confirmation UI
    ├── UserMenu/                # Sidebar dropdown (Settings link + Logout)
    └── hooks/
        ├── useProfileSection/
        ├── useSecuritySection/
        ├── usePreferencesSection/
        ├── useVaultSection/
        ├── useDangerSection/
        └── useUserMenu/
```

---

## Data Flow

### Preferences (optimistic local-first)

```
User changes preference → draft state in hook
  → handleSave():
    1. Update Zustand store (instant UI feedback)
    2. Fire-and-forget PATCH /users/me/preferences (background sync)
  → Zustand persist middleware → localStorage 'budget-preferences'
```

The store is the source of truth for current session. Backend sync is best-effort — if it fails, the local preference still applies.

### Password Change

```
SecuritySection → useSecuritySection hook
  → validatePasswordForm(values) → live PasswordValidationRules object
  → all rules green → submit enabled
  → useChangePasswordMutation.mutateAsync({ currentPassword, newPassword })
  → success → clear form + show confirmation
```

### Vault Sync/Export/Import

```
VaultSection → useVaultSection hook
  → handleSync: serialize stores → base64 encode → POST /users/me/vault
  → handleExport: serialize stores → Blob → download JSON file
  → handleTriggerImport: open file picker → parse JSON → hydrate stores
```

### Account Deletion

```
DangerSection → useDangerSection hook
  → ConfirmDialog (password field) → handleConfirmDelete
    → POST /users/me/delete (body: { password })
    → on success: logout + redirect to /login
```

---

## Key Decisions

### Preferences: Zustand persist + fire-and-forget PATCH

Preferences are stored in Zustand with `persist` middleware (localStorage key: `budget-preferences`). On save, the store updates immediately and a PATCH request is fired without awaiting the result. This gives instant UX with eventual consistency.

### Vault: Placeholder encryption

Current implementation uses `btoa(encodeURIComponent(json))` as a placeholder. **TODO:** Implement Web Crypto API encryption with PBKDF2 key derivation + AES-GCM-256 per [ADR-003](../../adr/003-local-first-e2ee-architecture.md).

### Cross-feature imports (ARCH-EXCEPTION)

`useVaultSection` imports `useTransactionsStore` and `useRulesStore` from other features to aggregate data stats and perform vault export/import. This violates the FSD dependency rule and is documented:

```typescript
// ARCH-EXCEPTION: cross-feature import — vault needs to read all stores for data stats.
// Planned resolution: centralized data layer (post-MVP)
```

### Password validation: OWASP ASVS 2.1

Frontend validation mirrors the backend password policy exactly:
- Min 8, max 128 characters
- Uppercase + lowercase + digit + special character
- `newPassword ≠ currentPassword`
- Confirmation match

Validation is real-time (rules update on each keystroke).

### Delete account: POST instead of DELETE

Uses `POST /users/me/delete` because the shared `HttpClient.delete()` method does not support request bodies. The backend accepts this route specifically for password-confirmed account deletion.

---

## Public API (index.ts)

```typescript
// Components
export { ConfirmDialog } from './ui/ConfirmDialog';
export { DangerSection } from './ui/DangerSection';
export { PreferencesSection } from './ui/PreferencesSection';
export { ProfileSection } from './ui/ProfileSection';
export { RestoreDialog } from './ui/RestoreDialog';
export { SecuritySection } from './ui/SecuritySection';
export { UserMenu } from './ui/UserMenu';
export { VaultSection } from './ui/VaultSection';

// Hooks
export { useUserMenu } from './ui/hooks/useUserMenu';

// Types
export type { PreferencesValues, ProfileData } from './model/types';
```

---

## Integration Points

| Integration | Where | How |
|---|---|---|
| **Sidebar UserMenu** | `app/layouts/Sidebar/UserSection/` | Imports `UserMenu` + `useUserMenu` from feature |
| **Routing** | `app/routing/routes.tsx` | `{ path: '/settings', element: <UserSettingsPage /> }` inside `RequireAuth` |
| **Settings page** | `pages/UserSettingsPage.tsx` | Composes sections: Profile → Security → Preferences → Vault → Danger |
| **Auth tokens** | `shared/api/auth-tokens` | `useLogoutMutation` calls `authTokens.clear()` |
| **API client** | `shared/api` | All mutations use `apiClient` + `ApiError` |

---

## Testing

**32 unit tests** in `model/validators.spec.ts` covering:

| Suite | Cases |
|---|---|
| `validatePasswordForm` — `minLength` | 4 cases (`it.each`) |
| `validatePasswordForm` — `maxLength` | 2 cases |
| `validatePasswordForm` — `hasUppercase` | 2 cases |
| `validatePasswordForm` — `hasLowercase` | 2 cases |
| `validatePasswordForm` — `hasDigit` | 2 cases |
| `validatePasswordForm` — `hasSpecialChar` | 2 cases |
| `validatePasswordForm` — `differentFromCurrent` | 3 cases |
| `validatePasswordForm` — `confirmationMatch` | 3 cases |
| `isPasswordFormValid` | 9 cases (all-valid + each rule false) |
| `validateDisplayName` | 3 cases |

Test builder pattern: `buildPasswordForm(overrides)` for reusable test data.

---

## TODOs

| Area | What | Reference |
|---|---|---|
| **Vault encryption** | Replace btoa placeholder with Web Crypto PBKDF2 + AES-GCM-256 | [ADR-003](../../adr/003-local-first-e2ee-architecture.md) |
| **Toast integration** | Add success/error toast notifications in mutation hooks | AppShell toast system |
| **Keyboard navigation** | Add `Escape` key handler and arrow-key nav for UserMenu dropdown | Accessibility |
| **Budget/profile stats** | Wire budgets and import profiles into vault DataStats | Post-MVP stores |

---

## Limitations

| Feature | Status |
|---|---|
| Two-factor auth | ❌ Not implemented |
| Session management (view active sessions) | ❌ Not implemented |
| Avatar/photo upload | ❌ Not implemented |
| Email change | ❌ Not implemented (email is identity) |
| E2EE vault encryption | ⏳ Placeholder only — see TODO |

---

*Updated: 2026-08-21 | Source: `client/src/features/user-settings/`*
