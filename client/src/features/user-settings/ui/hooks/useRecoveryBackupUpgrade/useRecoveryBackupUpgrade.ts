import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { API_CONTRACT } from '#features/user-settings/api/constants';
import { useRecoveryBackupAvailabilityQuery } from '#features/user-settings/api/useRecoveryBackupAvailabilityQuery';
import { useRecoveryBackupForm } from '#features/user-settings/ui/hooks/useRecoveryBackupForm';
import { useRecoveryBackupOperation } from '#features/user-settings/ui/hooks/useRecoveryBackupOperation';
import type { RecoveryBackupUpgradeResult } from '#features/user-settings/ui/hooks/useRecoveryBackupUpgrade/types';

export const useRecoveryBackupUpgrade = (): RecoveryBackupUpgradeResult => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const availability = useRecoveryBackupAvailabilityQuery();
  const form = useRecoveryBackupForm();
  const { phase, handleStart, handleCancel } = useRecoveryBackupOperation({
    canStart:
      availability.status === 'loaded' && !availability.data.isRegistered,
    clearForm: form.clearForm,
    requestConfirmation: form.requestConfirmation,
  });
  return {
    state:
      availability.status === 'loaded'
        ? {
            status: 'loaded',
            data: {
              title: t('settings.vault.backupUpgradeTitle'),
              description: t(
                availability.data.isRegistered
                  ? 'settings.vault.backupUpgradeConfigured'
                  : 'settings.vault.backupUpgradeDescription',
              ),
              actionLabel: t(
                phase === 'working'
                  ? 'settings.vault.backupUpgradeWorking'
                  : 'settings.vault.backupUpgradeStart',
              ),
              canStart:
                !availability.data.isRegistered &&
                phase !== 'working' &&
                phase !== 'completed',
              message:
                phase === 'completed'
                  ? t('settings.vault.backupUpgradeCompleted')
                  : undefined,
              hasError: false,
              handleStart,
            },
          }
        : availability.status === 'error'
          ? {
              status: 'error',
              error: t('settings.vault.backupUpgradeStatusFailed'),
            }
          : availability,
    code: form.code,
    confirmation: form.confirmation,
    qrSvg: form.qrSvg,
    qrMarkup: form.qrMarkup,
    confirmationError: form.confirmationError,
    canConfirm: form.canConfirm,
    formMessage: form.formMessage,
    handleConfirmationChange: form.handleConfirmationChange,
    handleConfirm: form.handleConfirm,
    handleCopy: form.handleCopy,
    handleDownload: form.handleDownload,
    operationError:
      phase === 'failed' ? t('settings.vault.backupUpgradeFailed') : undefined,
    handleCancel,
    handleRefresh: (): void => {
      void queryClient.invalidateQueries({
        queryKey: [API_CONTRACT.QUERY_KEYS.RECOVERY_BACKUP],
      });
    },
  };
};
