import { useTranslation } from 'react-i18next';

import type { RotationRecoveryConfirmation } from '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation/types';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Modal } from '#shared/ui/Modal';

interface RotationRecoveryDialogProps {
  readonly confirmation: RotationRecoveryConfirmation;
}

export const RotationRecoveryDialog = ({
  confirmation,
}: RotationRecoveryDialogProps): React.JSX.Element => {
  const { t } = useTranslation();
  return (
    <Modal
      isOpen={confirmation.recoveryCode !== undefined}
      title={t('settings.vault.rotationBackupTitle')}
      closeLabel={t('settings.vault.rotationBackupCancel')}
      onClose={confirmation.handleCancel}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t('settings.vault.rotationBackupDescription')}
        </p>
        <code className="break-all rounded-md bg-surface-2 p-3 font-mono text-sm text-foreground">
          {confirmation.recoveryCode}
        </code>
        <Button variant="secondary" onClick={confirmation.handleDownload}>
          {t('settings.vault.rotationBackupDownload')}
        </Button>
        <Input
          id="rotation-recovery-confirmation"
          label={t('settings.vault.rotationBackupConfirmation')}
          value={confirmation.confirmation}
          error={confirmation.confirmationError}
          onChange={confirmation.handleConfirmationChange}
          autoComplete="off"
          spellCheck={false}
        />
        <Button
          disabled={!confirmation.canConfirm}
          onClick={confirmation.handleConfirm}
        >
          {t('settings.vault.rotationBackupCommit')}
        </Button>
        <Button variant="ghost" onClick={confirmation.handleCancel}>
          {t('settings.vault.rotationBackupCancel')}
        </Button>
      </div>
    </Modal>
  );
};
