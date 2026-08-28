// User Settings — useRestoreOnLogin Hook

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import { decryptVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import { formatSyncDate } from '#features/user-settings/model/format-sync-date';
// ARCH-EXCEPTION: cross-feature import — vault restore needs to write all stores.
// Planned resolution: centralized data layer (post-MVP)
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import { isRuleRecordArray } from '#features/user-settings/ui/hooks/useVaultSection/is-rule-record-array';
import { isStoredTransactionArray } from '#features/user-settings/ui/hooks/useVaultSection/is-stored-transaction-array';
import { useToast } from '#shared/hooks/useToast';
import type { UseRestoreOnLoginResult } from '#features/user-settings/ui/hooks/useRestoreOnLogin/use-restore-on-login-result';

export const useRestoreOnLogin = (): UseRestoreOnLoginResult => {
  const { t } = useTranslation();
  const { data: vaultData, hasBackup, isLoading } = useVaultQuery();
  const transactions = useTransactionsStore((s) => s.transactions);
  const addToast = useToast((s) => s.addToast);

  const [showDialog, setShowDialog] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const isLocalEmpty = transactions.length === 0;
  const shouldPrompt = !isLoading && isLocalEmpty && hasBackup && !dismissed;

  useEffect(() => {
    if (shouldPrompt) {
      setShowDialog(true);
    }
  }, [shouldPrompt]);

  const backupDate = vaultData?.updatedAt ? formatSyncDate(vaultData.updatedAt) : '';

  const handleRestore = (password: string): void => {
    void performRestore(password);
  };

  const performRestore = async (password: string): Promise<void> => {
    if (!vaultData?.encryptedBlob) {
      return;
    }

    setIsRestoring(true);
    setError(undefined);

    try {
      const payload = await decryptVaultPayload(vaultData.encryptedBlob, password);

      if (payload.transactions.length > 0 && isStoredTransactionArray(payload.transactions)) {
        useTransactionsStore.setState({
          transactions: payload.transactions,
        });
      }
      if (payload.rules.length > 0 && isRuleRecordArray(payload.rules)) {
        useRulesStore.setState({
          rules: payload.rules,
        });
      }

      setShowDialog(false);
      addToast(t('settings.vault.restoreSuccess'), 'success');
    } catch (err) {
      if (err instanceof VaultDecryptionError) {
        setError(t('settings.vault.wrongPassword'));
        return;
      }
      setError(t('settings.vault.restoreError'));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDismiss = (): void => {
    setDismissed(true);
    setShowDialog(false);
  };

  return {
    showDialog,
    backupDate,
    isRestoring,
    error,
    handleRestore,
    handleDismiss,
  };
};
