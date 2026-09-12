import type {
  RecoveryBackupUpgradeOutcome,
  RecoveryBackupUpgradeRequest,
} from '#features/user-settings/model/recovery-backup-upgrade/types';

export interface RecoveryBackupUpgradeMutation {
  readonly registerBackup: (
    request: RecoveryBackupUpgradeRequest,
  ) => Promise<RecoveryBackupUpgradeOutcome>;
}
