// ═══════════════════════════════════════════════════════════════════
// User Settings Feature — Vault Helpers (pure functions)
// ═══════════════════════════════════════════════════════════════════

import type { VaultSyncStatus } from './types';

// ─── Vault Status ────────────────────────────────────────────────

export const computeVaultStatus = (
  hasBackup: boolean,
  lastSync: string | undefined,
): VaultSyncStatus => {
  if (!hasBackup) {
    return 'no-backup';
  }
  return lastSync !== undefined ? 'synced' : 'unsynced';
};

// ─── Date Formatting ─────────────────────────────────────────────

export const formatSyncDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ─── Size Estimation ─────────────────────────────────────────────

export const estimateSizeKb = (data: string): number =>
  Math.round(new TextEncoder().encode(data).length / 1024);
