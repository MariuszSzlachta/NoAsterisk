import type { RecoveryBackupUpgradeResult } from '#features/user-settings/ui/hooks/useRecoveryBackupUpgrade/types';

export interface RecoveryBackupForm extends Pick<
  RecoveryBackupUpgradeResult,
  | 'code'
  | 'confirmation'
  | 'qrSvg'
  | 'qrMarkup'
  | 'confirmationError'
  | 'canConfirm'
  | 'formMessage'
  | 'handleConfirmationChange'
  | 'handleConfirm'
  | 'handleCopy'
  | 'handleDownload'
> {
  readonly clearForm: () => void;
  readonly requestConfirmation: (
    backup: string,
    isCurrent: () => boolean,
  ) => Promise<boolean>;
}
