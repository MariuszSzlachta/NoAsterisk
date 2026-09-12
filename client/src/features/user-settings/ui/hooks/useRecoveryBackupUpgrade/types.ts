import type { RecoveryBackupUpgradeView } from '#features/user-settings/model/recovery-backup-upgrade/types';
import type { QueryState } from '#shared/api';

export interface RecoveryBackupUpgradeResult {
  readonly state: QueryState<RecoveryBackupUpgradeView>;
  readonly operationError: string | undefined;
  readonly code: string | undefined;
  readonly confirmation: string;
  readonly qrSvg: string | undefined;
  readonly qrMarkup: { readonly __html: string } | undefined;
  readonly confirmationError: string | undefined;
  readonly canConfirm: boolean;
  readonly formMessage: string | undefined;
  readonly handleConfirmationChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleConfirm: () => void;
  readonly handleCancel: () => void;
  readonly handleCopy: () => void;
  readonly handleDownload: () => void;
  readonly handleRefresh: () => void;
}
