// ═══════════════════════════════════════════════════════════════════
// Admin Feature — Model Types
// ═══════════════════════════════════════════════════════════════════

// ─── Users ───────────────────────────────────────────────────────

export type AdminUserRole = 'Superuser' | 'Member' | 'Blocked';

export interface AdminUserViewModel {
  readonly id: string;
  readonly email: string;
  readonly role: AdminUserRole;
  readonly createdAt: string;
  readonly hasVault: boolean;
}

// ─── Invite Codes ────────────────────────────────────────────────

// Backend returns PascalCase status values
export type InviteCodeStatus = 'Available' | 'Used' | 'Expired';

export interface InviteCodeViewModel {
  readonly id: string;
  readonly code: string;
  readonly status: InviteCodeStatus;
  readonly createdAt: string;
  // Backend returns null for these fields; API layer maps null → undefined
  readonly expiresAt: string | undefined;
  readonly usedBy: string | undefined;
  readonly usedAt: string | undefined;
}

// ─── Dashboard Stats ─────────────────────────────────────────────

export interface AdminDashboardStats {
  readonly totalUsers: number;
  readonly activeToday: number;
  readonly blockedCount: number;
  readonly availableCodes: number;
  readonly usedCodes: number;
}

// ─── Dictionary Types ────────────────────────────────────────────

export type DictionaryType = 'firstNames' | 'surnames' | 'cities' | 'merchants' | 'phrases';

export interface DictionaryEntryViewModel {
  readonly id: string;
  readonly value: string;
  readonly createdAt: string;
}

export interface DictionaryTypeInfo {
  readonly type: DictionaryType;
  readonly count: number;
  readonly lastUpdated: string | undefined;
}
