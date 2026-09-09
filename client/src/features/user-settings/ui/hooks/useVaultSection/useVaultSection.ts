// User Settings — useVaultSection Hook

import { useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

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
  serializeVaultPayload,
  type VaultRecords,
} from '#features/user-settings/model/vault-payload';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';
import { VaultSizeError } from '#features/user-settings/model/vault-size-error';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import type { UseVaultSectionResult } from '#features/user-settings/ui/hooks/useVaultSection/use-vault-section-result';
import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import { ApiError } from '#shared/api';
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
  const { data: vaultData, error, refetch } = useVaultQuery();
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
  const [hasConflict, setHasConflict] = useState(false);
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

  const syncMetadata = useSyncExternalStore(
    persistenceSyncMetadata.subscribe,
    persistenceSyncMetadata.get,
    persistenceSyncMetadata.get,
  );
  const remoteSnapshot =
    vaultData?.status === 'available' ? vaultData : undefined;
  const lastSync = syncMetadata.lastSuccessfulSyncAt
    ? formatSyncDate(syncMetadata.lastSuccessfulSyncAt)
    : undefined;
  const status = hasConflict
    ? 'conflict'
    : error !== undefined
      ? 'error'
      : isSyncing
        ? 'syncing'
        : computeVaultStatus(
            remoteSnapshot !== undefined,
            syncMetadata.isDirty,
            syncMetadata.lastSuccessfulSyncRevision,
            remoteSnapshot?.revision,
          );
  const vaultInfo: VaultInfo = {
    status,
    lastSync,
    remoteRevision: remoteSnapshot?.revision,
  };

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
    if (
      remoteSnapshot !== undefined &&
      (hasConflict || status === 'remote-newer')
    ) {
      void prepareOverwriteConfirmation();
      return;
    }
    openPasswordDialog('encrypt');
  };

  const openPasswordDialog = (mode: VaultPasswordMode): void => {
    setPasswordDialogMode(mode);
    setPasswordError(undefined);
    setShowPasswordDialog(true);
  };

  const prepareOverwriteConfirmation = async (): Promise<void> => {
    await refetch();
    if (!window.confirm(t('settings.vault.overwriteConfirmation'))) {
      return;
    }
    setHasConflict(false);
    openPasswordDialog('encrypt');
  };

  const handleRestore = (): void => {
    if (
      remoteSnapshot !== undefined &&
      !window.confirm(t('settings.vault.pullConfirmation'))
    ) {
      return;
    }
    setHasConflict(false);
    openPasswordDialog('decrypt');
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
      const encrypted = await encryptVault(
        serializeVaultPayload(payload),
        password,
      );
      const baseRevision =
        remoteSnapshot?.revision ?? syncMetadata.observedRevision ?? 0;
      const response = await uploadVault({
        encryptedBlob: encrypted,
        baseRevision,
      });
      persistenceSyncMetadata.markSynced(response.revision, response.updatedAt);
      setHasConflict(false);
      setShowPasswordDialog(false);
      addToast(t('settings.vault.syncSuccess'), 'success');
      void refetch();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setHasConflict(true);
        setPasswordError(t('settings.vault.conflict'));
        void refetch();
        return;
      }
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
      if (remoteSnapshot === undefined) {
        setPasswordError(t('settings.vault.noBackup'));
        return;
      }

      const payload = await decryptVaultPayload(
        remoteSnapshot.encryptedBlob,
        password,
      );
      await restoreVaultPayload(payload);
      persistenceSyncMetadata.markSynced(
        remoteSnapshot.revision,
        remoteSnapshot.updatedAt,
      );
      persistenceSyncMetadata.rememberRevision(remoteSnapshot.revision);
      setHasConflict(false);

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
