import type { RecoveryBackupUpgradeView } from '#features/user-settings/model/recovery-backup-upgrade/types';
import { Button } from '#shared/ui/Button';
import { Card, CardHeader } from '#shared/ui/Card';

interface RecoveryBackupUpgradeReadyProps {
  readonly model: RecoveryBackupUpgradeView;
}
export const RecoveryBackupUpgradeReady = ({
  model,
}: RecoveryBackupUpgradeReadyProps): React.JSX.Element => (
  <Card>
    <CardHeader title={model.title} subtitle={model.description} />
    {model.message !== undefined && (
      <p
        className={
          model.hasError
            ? 'mb-3 text-sm text-expense'
            : 'mb-3 text-sm text-income'
        }
        role={model.hasError ? 'alert' : 'status'}
      >
        {model.message}
      </p>
    )}
    <Button
      variant="secondary"
      disabled={!model.canStart}
      onClick={model.handleStart}
    >
      {model.actionLabel}
    </Button>
  </Card>
);
