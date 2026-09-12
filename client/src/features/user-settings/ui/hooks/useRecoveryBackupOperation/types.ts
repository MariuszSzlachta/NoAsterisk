import type { RecoveryBackupUpgradeState } from '#features/user-settings/model/recovery-backup-upgrade/types';

export interface RecoveryBackupOperationInput {
  readonly canStart: boolean;
  readonly clearForm: () => void;
  readonly requestConfirmation: (
    backup: string,
    isCurrent: () => boolean,
  ) => Promise<boolean>;
}

export interface RecoveryBackupOperation {
  readonly phase: RecoveryBackupUpgradeState['phase'];
  readonly handleStart: () => void;
  readonly handleCancel: () => void;
}
