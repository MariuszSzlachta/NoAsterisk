// ═══════════════════════════════════════════════════════════════════
// User Settings — useVaultSection Hook
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useRef, useState } from 'react';

import { useUploadVaultMutation } from '#features/user-settings/api/useUploadVaultMutation';
import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import type { DataStats, VaultInfo } from '#features/user-settings/model/types';
import {
  computeVaultStatus,
  estimateSizeKb,
  formatSyncDate,
} from '#features/user-settings/model/vault-helpers';
// ARCH-EXCEPTION: cross-feature import — vault needs to read all stores for data stats.
// Planned resolution: centralized data layer (post-MVP)
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';

// ─── Result Interface ────────────────────────────────────────────

interface UseVaultSectionResult {
  readonly vaultInfo: VaultInfo;
  readonly dataStats: DataStats;
  readonly isSyncing: boolean;
  readonly importError: string | undefined;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly handleSync: () => void;
  readonly handleExport: () => void;
  readonly handleTriggerImport: () => void;
  readonly handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useVaultSection = (): UseVaultSectionResult => {
  const { data: vaultData, hasBackup } = useVaultQuery();
  const { state: uploadState, mutateAsync: uploadVault } = useUploadVaultMutation();

  const transactions = useTransactionsStore((s) => s.transactions);
  const rules = useRulesStore((s) => s.rules);

  const [isSyncing, setIsSyncing] = useState(false);
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lastSync = vaultData?.updatedAt ? formatSyncDate(vaultData.updatedAt) : undefined;
  const status = computeVaultStatus(hasBackup, lastSync);

  const vaultInfo: VaultInfo = { status, lastSync };

  const dataStats: DataStats = useMemo(() => {
    const json = JSON.stringify({ transactions, rules });
    return {
      transactions: transactions.length,
      budgets: 0, // TODO: add budgets store when available
      rules: rules.length,
      importProfiles: 0, // TODO: add import profiles store when available
      sizeKb: estimateSizeKb(json),
    };
  }, [transactions, rules]);

  const handleSync = (): void => {
    setIsSyncing(true);
    // TODO: Encrypt with Web Crypto API (PBKDF2 + AES-GCM-256) before uploading
    const json = JSON.stringify({ transactions, rules });
    const blob = btoa(unescape(encodeURIComponent(json)));
    void uploadVault({ encryptedBlob: blob }).finally(() => { setIsSyncing(false); });
  };

  const handleExport = (): void => {
    const json = JSON.stringify({ transactions, rules }, undefined, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerImport = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setImportError(undefined);
    void file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as Record<string, unknown>;

        if (!Array.isArray(parsed.transactions) && !Array.isArray(parsed.rules)) {
          setImportError('Nieprawidłowy format pliku — brak danych transakcji lub reguł');
          return;
        }

        if (Array.isArray(parsed.transactions)) {
          useTransactionsStore.setState({ transactions: parsed.transactions });
        }
        if (Array.isArray(parsed.rules)) {
          useRulesStore.setState({ rules: parsed.rules });
        }
      } catch {
        setImportError('Nieprawidłowy plik JSON');
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    vaultInfo,
    dataStats,
    isSyncing: isSyncing || uploadState.isLoading,
    importError,
    fileInputRef,
    handleSync,
    handleExport,
    handleTriggerImport,
    handleFileInputChange,
  };
};
