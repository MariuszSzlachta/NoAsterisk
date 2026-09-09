// User Settings — useRestoreOnLogin Hook

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import { decryptVaultPayload } from '#features/user-settings/model/decrypt-vault-payload';
import { formatSyncDate } from '#features/user-settings/model/format-sync-date';
import type { RestoreOnLoginState } from '#features/user-settings/model/types/restore-on-login-state';
import { VaultDecryptionError } from '#features/user-settings/model/vault-decryption-error';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import type { UseRestoreOnLoginResult } from '#features/user-settings/ui/hooks/useRestoreOnLogin/use-restore-on-login-result';
// ARCH-EXCEPTION: cross-feature import — vault restore needs to write all stores.
// Planned resolution: centralized data layer (post-MVP)
import { useTransactionsStore } from '#entities/transaction';
import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import { useToast } from '#shared/hooks/useToast';

export const useRestoreOnLogin = (): UseRestoreOnLoginResult => {
  const { t } = useTranslation();
  const { data: vaultData, hasRemoteSnapshot, isLoading } = useVaultQuery();
  const transactions = useTransactionsStore((s) => s.transactions);
  const addToast = useToast((s) => s.addToast);

  const [restoreState, setRestoreState] = useState<RestoreOnLoginState>({
    status: 'hidden',
  });

  const isLocalEmpty = transactions.length === 0;
  const shouldPrompt =
    !isLoading &&
    isLocalEmpty &&
    hasRemoteSnapshot &&
    restoreState.status === 'hidden';

  useEffect(() => {
    if (shouldPrompt) {
      setRestoreState({ status: 'prompt' });
    }
  }, [shouldPrompt]);

  const backupDate =
    vaultData?.status === 'available'
      ? formatSyncDate(vaultData.updatedAt)
      : '';

  const handleRestore = (password: string): void => {
    void performRestore(password);
  };

  const performRestore = async (password: string): Promise<void> => {
    if (vaultData?.status !== 'available') {
      return;
    }

    setRestoreState({ status: 'restoring' });

    try {
      const payload = await decryptVaultPayload(
        vaultData.encryptedBlob,
        password,
      );
      await restoreVaultPayload(payload);
      persistenceSyncMetadata.markSynced(
        vaultData.revision,
        vaultData.updatedAt,
      );

      setRestoreState({ status: 'dismissed' });
      addToast(t('settings.vault.restoreSuccess'), 'success');
    } catch (err) {
      if (err instanceof VaultDecryptionError) {
        setRestoreState({
          status: 'error',
          message: t('settings.vault.wrongPassword'),
        });
        return;
      }
      setRestoreState({
        status: 'error',
        message: t('settings.vault.restoreError'),
      });
    }
  };

  const handleDismiss = (): void => {
    setRestoreState({ status: 'dismissed' });
  };

  const isDialogVisible =
    restoreState.status !== 'hidden' && restoreState.status !== 'dismissed';
  const isRestoring = restoreState.status === 'restoring';
  const error =
    restoreState.status === 'error' ? restoreState.message : undefined;

  return {
    showDialog: isDialogVisible,
    backupDate,
    isRestoring,
    error,
    handleRestore,
    handleDismiss,
  };
};
