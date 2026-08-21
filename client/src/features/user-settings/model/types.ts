// ═══════════════════════════════════════════════════════════════════
// User Settings Feature — Model Types
// ═══════════════════════════════════════════════════════════════════

// ─── Profile ─────────────────────────────────────────────────────

export type UserRole = 'Superuser' | 'Member';

export interface ProfileData {
  readonly id: string;
  readonly email: string;
  readonly displayName: string | undefined;
  readonly role: UserRole;
  readonly workspaceId: string;
  readonly createdAt: string; // ISO
}

// ─── Password ────────────────────────────────────────────────────

export interface PasswordFormValues {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

export interface PasswordValidationRules {
  readonly minLength: boolean;
  readonly maxLength: boolean;
  readonly hasUppercase: boolean;
  readonly hasLowercase: boolean;
  readonly hasDigit: boolean;
  readonly hasSpecialChar: boolean;
  readonly differentFromCurrent: boolean;
  readonly confirmationMatch: boolean;
}

// ─── Vault ───────────────────────────────────────────────────────

export type VaultSyncStatus = 'synced' | 'unsynced' | 'no-backup';

export interface VaultInfo {
  readonly status: VaultSyncStatus;
  readonly lastSync: string | undefined; // "DD.MM.YYYY, HH:mm"
}

export interface DataStats {
  readonly transactions: number;
  readonly budgets: number;
  readonly rules: number;
  readonly importProfiles: number;
  readonly sizeKb: number;
}

// ─── Preferences ─────────────────────────────────────────────────

export interface PreferencesValues {
  readonly currency: string;
  readonly dateFormat: string;
  readonly language: string;
  readonly theme: string;
  readonly homePage: string;
}

// ─── Confirm Dialog ──────────────────────────────────────────────
// ConfirmDialogField lives in ui/ layer — it contains onChange callback (UI concern)
