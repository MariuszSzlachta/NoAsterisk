// User Settings — useVaultSection Hook

import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUploadVaultMutation } from '#features/user-settings/api/useUploadVaultMutation';
import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import { decryptVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';
import { isValidVaultItem } from '#features/user-settings/model/decrypt-vault-payload/is-valid-vault-item';
import { encryptVault } from '#features/user-settings/model/encrypt-vault';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { isRuleRecord } from '#features/admin-rules/model/is-rule-record';
import type { StoredTransaction } from '#features/transactions/model/types';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { DataStats } from '#features/user-settings/model/types/data-stats';
import type { VaultInfo } from '#features/user-settings/model/types/vault-info';
import { computeVaultStatus } from '#features/user-settings/model/compute-vault-status';
import { estimateSizeKb } from '#features/user-settings/model/estimate-size-kb';
import { formatSyncDate } from '#features/user-settings/model/format-sync-date';
import type { VaultPasswordMode } from '#features/user-settings/ui/VaultPasswordDialog';
// ARCH-EXCEPTION: cross-feature import — vault needs to read all stores for data stats.
// Planned resolution: centralized data layer (post-MVP)
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import { useToast } from '#shared/hooks/useToast';
import { isRecord } from '#features/user-settings/ui/hooks/useVaultSection/is-record';
import { isRuleRecordArray } from '#features/user-settings/ui/hooks/useVaultSection/is-rule-record-array';
import { isStoredTransactionArray } from '#features/user-settings/ui/hooks/useVaultSection/is-stored-transaction-array';
import type { UseVaultSectionResult } from '#features/user-settings/ui/hooks/useVaultSection/use-vault-section-result';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const transactionRepository = encryptedPersistence.repository<StoredTransaction>(
  'transactions',
  isStoredTransaction,
  (record) => record.id,
);
const ruleRepository = encryptedPersistence.repository<RuleRecord>(
  'rules',
  isRuleRecord,
  (record) => record.id,
);

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

      if (payload.transactions.length > 0 && isStoredTransactionArray(payload.transactions)) {
        await transactionRepository.replace(payload.transactions);
        useTransactionsStore.setState({
          transactions: payload.transactions,
        });
      }
      if (payload.rules.length > 0 && isRuleRecordArray(payload.rules)) {
        await ruleRepository.replace(payload.rules);
        useRulesStore.setState({
          rules: payload.rules,
        });
      }

      setShowPasswordDialog(false);
      addToast(t('settings.vault.restoreSuccess'), 'success');
    } catch (err) {
      if (err instanceof VaultDecryptionError) {
        setPasswordError(t('settings.vault.wrongPassword'));
        return;
      }
      setPasswordError(t('settings.vault.restoreError'));
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
    void file.text().then(async (text) => {
      try {
        const parsed: unknown = JSON.parse(text);

        if (!isRecord(parsed)) {
          setImportError(t('settings.vault.importInvalidFormat'));
          return;
        }

        if (!Array.isArray(parsed['transactions']) && !Array.isArray(parsed['rules'])) {
          setImportError(t('settings.vault.importInvalidFormat'));
          return;
        }

        if (Array.isArray(parsed['transactions'])) {
          const validTransactions = parsed['transactions'].filter(isValidVaultItem);
          if (isStoredTransactionArray(validTransactions)) {
            await transactionRepository.replace(validTransactions);
            useTransactionsStore.setState({ transactions: validTransactions });
          }
        }
        if (Array.isArray(parsed['rules'])) {
          const validRules = parsed['rules'].filter(isValidVaultItem);
          if (isRuleRecordArray(validRules)) {
            await ruleRepository.replace(validRules);
            useRulesStore.setState({ rules: validRules });
          }
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
