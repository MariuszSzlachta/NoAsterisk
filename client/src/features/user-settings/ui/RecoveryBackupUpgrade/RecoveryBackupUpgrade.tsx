import { useTranslation } from 'react-i18next';

import { useRecoveryBackupUpgrade } from '#features/user-settings/ui/hooks/useRecoveryBackupUpgrade';
import { RecoveryBackupUpgradeDialog } from '#features/user-settings/ui/RecoveryBackupUpgradeDialog';
import { renderRecoveryBackupUpgrade } from '#features/user-settings/ui/render-recovery-backup-upgrade';
import { Button } from '#shared/ui/Button';
import { QueryRenderer } from '#shared/ui/QueryRenderer';

export const RecoveryBackupUpgrade = (): React.JSX.Element => {
  const { t } = useTranslation();
  const model = useRecoveryBackupUpgrade();
  return (
    <>
      {model.operationError !== undefined && (
        <p role="alert" className="text-sm text-expense">
          {model.operationError}
        </p>
      )}
      <QueryRenderer state={model.state}>
        {renderRecoveryBackupUpgrade}
      </QueryRenderer>
      {(model.state.status === 'error' ||
        model.operationError !== undefined) && (
        <Button variant="secondary" onClick={model.handleRefresh}>
          {t('settings.vault.backupUpgradeRecheck')}
        </Button>
      )}
      <RecoveryBackupUpgradeDialog model={model} />
    </>
  );
};
