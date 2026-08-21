// ═══════════════════════════════════════════════════════════════════
// User Settings — useRestoreOnLogin Hook
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVaultQuery } from '#features/user-settings/api/useVaultQuery';
import { decryptVaultPayload, VaultDecryptionError } from '#features/user-settings/model/crypto';
import { formatSyncDate } from '#features/user-settings/model/vault-helpers';
// ARCH-EXCEPTION: cross-feature import — vault restore needs to write all stores.
// Planned resolution: centralized data layer (post-MVP)
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import type { RuleRecord } from '#features/admin-rules/model/types';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import type { StoredTransaction } from '#features/transactions/model/types';
import { useToast } from '#shared/hooks/useToast';

// ─── Result Interface ────────────────────────────────────────────

interface UseRestoreOnLoginResult {
  readonly showDialog: boolean;
  readonly backupDate: string;
  readonly isRestoring: boolean;
  readonly error: string | undefined;
  readonly handleRestore: (password: string) => void;
  readonly handleDismiss: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────

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

      // Boundary cast: items validated at runtime (have 'id' field), cast to store types
      if (payload.transactions.length > 0) {
        useTransactionsStore.setState({
          transactions: payload.transactions as unknown as ReadonlyArray<StoredTransaction>,
        });
      }
      if (payload.rules.length > 0) {
        useRulesStore.setState({
          rules: payload.rules as unknown as ReadonlyArray<RuleRecord>,
        });
      }

      setShowDialog(false);
      addToast(t('settings.vault.restoreSuccess'), 'success');
    } catch (err) {
      if (err instanceof VaultDecryptionError) {
        setError(t('settings.vault.wrongPassword'));
      } else {
        setError(t('settings.vault.restoreError'));
      }
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
