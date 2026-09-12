import type { RecoveryBackupUpgradeView } from '#features/user-settings/model/recovery-backup-upgrade/types';
import { RecoveryBackupUpgradeReady } from '#features/user-settings/ui/RecoveryBackupUpgradeReady';

export const renderRecoveryBackupUpgrade = (
  model: RecoveryBackupUpgradeView,
): React.JSX.Element => <RecoveryBackupUpgradeReady model={model} />;
