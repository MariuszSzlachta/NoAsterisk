import { useMutation, useQueryClient } from '@tanstack/react-query';

import { API_CONTRACT } from '#features/user-settings/api/constants';
import { upgradeRecoveryBackup } from '#features/user-settings/api/upgrade-recovery-backup';
import type { RecoveryBackupUpgradeMutation } from '#features/user-settings/api/useRecoveryBackupUpgradeMutation/types';
import type { RecoveryBackupUpgradeRequest } from '#features/user-settings/model/recovery-backup-upgrade/types';

export const useRecoveryBackupUpgradeMutation =
  (): RecoveryBackupUpgradeMutation => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
      retry: false,
      gcTime: 0,
      mutationFn: (request: RecoveryBackupUpgradeRequest) =>
        upgradeRecoveryBackup(request.confirmBackup, request.assertCurrent),
      // An interrupted response can still have committed the public authority.
      onSettled: (): void => {
        void queryClient.invalidateQueries({
          queryKey: [API_CONTRACT.QUERY_KEYS.RECOVERY_BACKUP],
        });
      },
    });
    return { registerBackup: mutation.mutateAsync };
  };
