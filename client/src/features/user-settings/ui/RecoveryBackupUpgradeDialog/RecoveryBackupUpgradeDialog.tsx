import { useTranslation } from 'react-i18next';

import type { RecoveryBackupUpgradeResult } from '#features/user-settings/ui/hooks/useRecoveryBackupUpgrade/types';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Modal } from '#shared/ui/Modal';

interface RecoveryBackupUpgradeDialogProps {
  readonly model: RecoveryBackupUpgradeResult;
}
export const RecoveryBackupUpgradeDialog = ({
  model,
}: RecoveryBackupUpgradeDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={model.code !== undefined}
      title={t('settings.vault.backupUpgradeTitle')}
      closeLabel={t('settings.vault.rotationBackupCancel')}
      onClose={model.handleCancel}
      className="max-h-full overflow-y-auto"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t('settings.vault.backupUpgradeSaveDescription')}
        </p>
        <p className="text-sm text-warning">
          {t('settings.vault.backupUpgradeCompromiseWarning')}
        </p>
        <code className="break-all rounded-md bg-surface-2 p-3 font-mono text-sm text-foreground">
          {model.code}
        </code>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={model.handleCopy}>
            {t('settings.vault.backupUpgradeCopy')}
          </Button>
          <Button variant="secondary" onClick={model.handleDownload}>
            {t('settings.vault.rotationBackupDownload')}
          </Button>
        </div>
        {model.qrMarkup !== undefined && (
          <div
            role="img"
            aria-label={t('settings.vault.backupUpgradeQr')}
            className="mx-auto w-full max-w-48 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={model.qrMarkup}
          />
        )}
        {model.formMessage !== undefined && (
          <p role="status" className="text-sm text-muted-foreground">
            {model.formMessage}
          </p>
        )}
        <Input
          id="backup-upgrade-confirmation"
          label={t('settings.vault.rotationBackupConfirmation')}
          value={model.confirmation}
          error={model.confirmationError}
          onChange={model.handleConfirmationChange}
          autoComplete="off"
          spellCheck={false}
        />
        <Button disabled={!model.canConfirm} onClick={model.handleConfirm}>
          {t('settings.vault.backupUpgradeConfirm')}
        </Button>
        <Button variant="ghost" onClick={model.handleCancel}>
          {t('settings.vault.rotationBackupCancel')}
        </Button>
      </div>
    </Modal>
  );
};
