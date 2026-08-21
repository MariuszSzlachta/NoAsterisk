// ═══════════════════════════════════════════════════════════════════
// User Settings — useVaultSection Hook
// ═══════════════════════════════════════════════════════════════════

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUploadVaultMutation } from '#features/user-settings/api/useUploadVaultMutation';
import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import {
  encryptVault,
  VaultDecryptionError,
  decryptVaultPayload,
} from '#features/user-settings/model/crypto';
import type { DataStats, VaultInfo } from '#features/user-settings/model/types';
import {
  computeVaultStatus,
  estimateSizeKb,
  formatSyncDate,
} from '#features/user-settings/model/vault-helpers';
import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog';
// ARCH-EXCEPTION: cross-feature import — vault needs to read all stores for data stats.
// Planned resolution: centralized data layer (post-MVP)
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import { useToast } from '#shared/hooks/useToast';

// ─── Result Interface ────────────────────────────────────────────

interface UseVaultSectionResult {
  readonly vaultInfo: VaultInfo;
  readonly dataStats: DataStats;
  readonly isSyncing: boolean;
  readonly importError: string | undefined;
  readonly fileInputRef: React.RefObject<HTMLInputElement | null>;
  readonly showPasswordDialog: boolean;
  readonly passwordDialogMode: VaultPasswordMode;
  readonly passwordError: string | undefined;
  readonly handleSync: () => void;
  readonly handleRestore: () => void;
  readonly handleExport: () => void;
  readonly handleTriggerImport: () => void;
  readonly handleFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handlePasswordSubmit: (password: string) => void;
  readonly handlePasswordCancel: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useVaultSection = (): UseVaultSectionResult => {
  const { t } = useTranslation();
  const { data: vaultData, hasBackup, refetch } = useVaultQuery();
  const { mutateAsync: uploadVault } = useUploadVaultMutation();
  const addToast = useToast((s) => s.addToast);

  const transactions = useTransactionsStore((s) => s.transactions);
  const rules = useRulesStore((s) => s.rules);

  const [isSyncing, setIsSyncing] = useState(false);
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] = useState<VaultPasswordMode>('encrypt');
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const lastSync = vaultData?.updatedAt ? formatSyncDate(vaultData.updatedAt) : undefined;
  const status = computeVaultStatus(hasBackup, lastSync);

  const vaultInfo: VaultInfo = { status, lastSync };

  const dataStats: DataStats = useMemo(() => {
    const json = JSON.stringify({ transactions, rules });
    return {
      transactions: transactions.length,
      budgets: 0,
      rules: rules.length,
      importProfiles: 0,
      sizeKb: estimateSizeKb(json),
    };
  }, [transactions, rules]);

  const handleSync = (): void => {
    setPasswordDialogMode('encrypt');
    setPasswordError(undefined);
    setShowPasswordDialog(true);
  };

  const handleRestore = (): void => {
    setPasswordDialogMode('decrypt');
    setPasswordError(undefined);
    setShowPasswordDialog(true);
  };

  const handlePasswordSubmit = (password: string): void => {
    if (passwordDialogMode === 'encrypt') {
      void performEncryptAndUpload(password);
    } else {
      void performDecryptAndRestore(password);
    }
  };

  const handlePasswordCancel = (): void => {
    setShowPasswordDialog(false);
    setPasswordError(undefined);
  };

  const performEncryptAndUpload = async (password: string): Promise<void> => {
    setIsSyncing(true);
    setPasswordError(undefined);

    try {
      const json = JSON.stringify({ transactions, rules });
      const encrypted = await encryptVault(json, password);
      await uploadVault({ encryptedBlob: encrypted });
      setShowPasswordDialog(false);
      addToast(t('settings.vault.syncSuccess'), 'success');
      void refetch();
    } catch {
      setPasswordError(t('settings.vault.syncError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const performDecryptAndRestore = async (password: string): Promise<void> => {
    setIsSyncing(true);
    setPasswordError(undefined);

    try {
      if (!vaultData?.encryptedBlob) {
        setPasswordError(t('settings.vault.noBackup'));
        return;
      }

      const payload = await decryptVaultPayload(vaultData.encryptedBlob, password);

      if (payload.transactions.length > 0) {
        useTransactionsStore.setState({ transactions: payload.transactions });
      }
      if (payload.rules.length > 0) {
        useRulesStore.setState({ rules: payload.rules });
      }

      setShowPasswordDialog(false);
      addToast(t('settings.vault.restoreSuccess'), 'success');
    } catch (err) {
      if (err instanceof VaultDecryptionError) {
        setPasswordError(t('settings.vault.wrongPassword'));
      } else {
        setPasswordError(t('settings.vault.restoreError'));
      }
    } finally {
      setIsSyncing(false);
    }
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
          setImportError(t('settings.vault.importInvalidFormat'));
          return;
        }

        const isValidItem = (item: unknown): item is Record<string, unknown> =>
          typeof item === 'object' && item !== null && 'id' in item;

        if (Array.isArray(parsed.transactions)) {
          const validTransactions = (parsed.transactions as unknown[]).filter(isValidItem);
          useTransactionsStore.setState({ transactions: validTransactions });
        }
        if (Array.isArray(parsed.rules)) {
          const validRules = (parsed.rules as unknown[]).filter(isValidItem);
          useRulesStore.setState({ rules: validRules });
        }

        addToast(t('settings.vault.importSuccess'), 'success');
      } catch {
        setImportError(t('settings.vault.importInvalidJson'));
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return {
    vaultInfo,
    dataStats,
    isSyncing,
    importError,
    fileInputRef,
    showPasswordDialog,
    passwordDialogMode,
    passwordError,
    handleSync,
    handleRestore,
    handleExport,
    handleTriggerImport,
    handleFileInputChange,
    handlePasswordSubmit,
    handlePasswordCancel,
  };
};
