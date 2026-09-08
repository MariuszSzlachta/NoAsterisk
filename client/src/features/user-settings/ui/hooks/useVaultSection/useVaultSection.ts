// User Settings — useVaultSection Hook

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useImportHistoryStore } from '#entities/import-batch';
import { useUploadVaultMutation } from '#features/user-settings/api/useUploadVaultMutation';
import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import { computeVaultStatus } from '#features/user-settings/model/compute-vault-status';
import { createValidatedVaultPayload } from '#features/user-settings/model/create-validated-vault-payload';
import {
  decryptVaultPayload,
  parseVaultPayload,
} from '#features/user-settings/model/decrypt-vault-payload';
import { encryptVault } from '#features/user-settings/model/encrypt-vault';
import { estimateSizeKb } from '#features/user-settings/model/estimate-size-kb';
import { formatSyncDate } from '#features/user-settings/model/format-sync-date';
import type { DataStats } from '#features/user-settings/model/types/data-stats';
import type { VaultInfo } from '#features/user-settings/model/types/vault-info';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import { MAX_PLAINTEXT_VAULT_LENGTH } from '#features/user-settings/model/vault-limits';
import {
  digestVaultRecords,
  serializeVaultPayload,
  type VaultRecords,
} from '#features/user-settings/model/vault-payload';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';
import { VaultSizeError } from '#features/user-settings/model/vault-size-error';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import type { UseVaultSectionResult } from '#features/user-settings/ui/hooks/useVaultSection/use-vault-section-result';
import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog';
import { useCategoriesStore } from '#entities/category';
import { useToast } from '#shared/hooks/useToast';

const buildRecords = (): VaultRecords => ({
  transactions: useTransactionsStore.getState().transactions,
  rules: useRulesStore.getState().rules,
  categories: useCategoriesStore.getState().categories,
  budgets: useBudgetsStore.getState().budgets,
  periodHistory: usePeriodHistoryStore.getState().history,
  importHistory: useImportHistoryStore.getState().history,
});

export const useVaultSection = (): UseVaultSectionResult => {
  const { t } = useTranslation();
  const { data: vaultData, hasBackup, refetch } = useVaultQuery();
  const { mutateAsync: uploadVault } = useUploadVaultMutation();
  const addToast = useToast((s) => s.addToast);

  const transactions = useTransactionsStore((s) => s.transactions);
  const rules = useRulesStore((s) => s.rules);
  const categories = useCategoriesStore((s) => s.categories);
  const budgets = useBudgetsStore((s) => s.budgets);
  const periodHistory = usePeriodHistoryStore((s) => s.history);
  const importHistory = useImportHistoryStore((s) => s.history);

  const [isSyncing, setIsSyncing] = useState(false);
  const [importError, setImportError] = useState<string | undefined>(undefined);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogMode, setPasswordDialogMode] =
    useState<VaultPasswordMode>('encrypt');
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined,
  );
  const [localDigest, setLocalDigest] = useState<string | undefined>(undefined);
  const [uploadedDigest, setUploadedDigest] = useState<string | undefined>(
    undefined,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const records = useMemo<VaultRecords>(
    () => ({
      transactions,
      rules,
      categories,
      budgets,
      periodHistory,
      importHistory,
    }),
    [transactions, rules, categories, budgets, periodHistory, importHistory],
  );

  useEffect(() => {
    let isCancelled = false;
    void digestVaultRecords(records).then((digest) => {
      if (!isCancelled) {
        setLocalDigest(digest);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [records]);

  const lastSync = vaultData?.updatedAt
    ? formatSyncDate(vaultData.updatedAt)
    : undefined;
  const status = computeVaultStatus(
    hasBackup,
    lastSync,
    uploadedDigest !== undefined && localDigest !== uploadedDigest,
  );
  const vaultInfo: VaultInfo = { status, lastSync };

  const dataStats: DataStats = useMemo(() => {
    const payload = createValidatedVaultPayload(records);
    return {
      transactions: payload.transactions.length,
      categories: payload.categories.length,
      budgets: payload.budgets.length,
      rules: payload.rules.length,
      periodHistory: payload.periodHistory.length,
      importHistory: payload.importHistory.length,
      sizeKb: estimateSizeKb(serializeVaultPayload(payload)),
    };
  }, [records]);

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
      return;
    }
    void performDecryptAndRestore(password);
  };

  const handlePasswordCancel = (): void => {
    setShowPasswordDialog(false);
    setPasswordError(undefined);
  };

  const performEncryptAndUpload = async (password: string): Promise<void> => {
    setIsSyncing(true);
    setPasswordError(undefined);

    try {
      const payload = createValidatedVaultPayload(buildRecords());
      const digest = await digestVaultRecords(payload);
      const encrypted = await encryptVault(
        serializeVaultPayload(payload),
        password,
      );
      await uploadVault({ encryptedBlob: encrypted });
      setUploadedDigest(digest);
      setShowPasswordDialog(false);
      addToast(t('settings.vault.syncSuccess'), 'success');
      void refetch();
    } catch (error) {
      setPasswordError(
        error instanceof VaultSizeError
          ? t('settings.vault.tooLarge')
          : t('settings.vault.syncError'),
      );
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

      const payload = await decryptVaultPayload(
        vaultData.encryptedBlob,
        password,
      );
      await restoreVaultPayload(payload);
      if (payload.schemaVersion === 1) {
        setUploadedDigest(await digestVaultRecords(payload));
      }

      setShowPasswordDialog(false);
      addToast(t('settings.vault.restoreSuccess'), 'success');
    } catch (error) {
      if (error instanceof VaultDecryptionError) {
        setPasswordError(t('settings.vault.wrongPassword'));
        return;
      }
      setPasswordError(t('settings.vault.restoreError'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = (): void => {
    const payload = createValidatedVaultPayload(buildRecords());
    const blob = new Blob([serializeVaultPayload(payload)], {
      type: 'application/json',
    });
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

  const importVaultFile = async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      if (new TextEncoder().encode(text).length > MAX_PLAINTEXT_VAULT_LENGTH) {
        setImportError(t('settings.vault.tooLarge'));
        return;
      }

      await restoreVaultPayload(parseVaultPayload(text));
      addToast(t('settings.vault.importSuccess'), 'success');
    } catch (error) {
      setImportError(
        error instanceof VaultPayloadError
          ? t('settings.vault.importInvalidFormat')
          : t('settings.vault.importInvalidJson'),
      );
    }
  };

  const handleFileInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setImportError(undefined);
    void importVaultFile(file);

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
