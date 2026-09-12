import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { recoveryBackupFile } from '#features/user-settings/ui/hooks/useRecoveryBackupForm/constants';
import type { RecoveryBackupForm } from '#features/user-settings/ui/hooks/useRecoveryBackupForm/types';
import { recoveryQr } from '#shared/adapters/vault-protocol/recovery-qr';

export const useRecoveryBackupForm = (): RecoveryBackupForm => {
  const { t } = useTranslation();
  // Backup/form contents are component-local and volatile, never Zustand/cache/persistence.
  const [code, setCode] = useState<string>();
  const [confirmation, setConfirmation] = useState('');
  const [qrSvg, setQrSvg] = useState<string>();
  const [formMessage, setFormMessage] = useState<string>();
  const pending = useRef<((confirmed: boolean) => void) | undefined>(undefined);
  const generation = useRef(0);
  const clearForm = (): void => {
    generation.current += 1;
    const resolve = pending.current;
    pending.current = undefined;
    resolve?.(false);
    setCode(undefined);
    setConfirmation('');
    setQrSvg(undefined);
    setFormMessage(undefined);
  };
  useEffect(
    () => () => {
      generation.current += 1;
      pending.current?.(false);
      pending.current = undefined;
    },
    [],
  );
  const requestConfirmation = (
    backup: string,
    isCurrent: () => boolean,
  ): Promise<boolean> => {
    const started = ++generation.current;
    setCode(backup);
    const result = new Promise<boolean>((resolve) => {
      pending.current = resolve;
    });
    void recoveryQr
      .render(backup)
      .then((svg) => {
        if (
          generation.current === started &&
          pending.current !== undefined &&
          isCurrent()
        )
          setQrSvg(svg);
      })
      .catch(() => {
        if (
          generation.current === started &&
          pending.current !== undefined &&
          isCurrent()
        )
          setFormMessage(t('settings.vault.backupUpgradeQrUnavailable'));
      });
    return result;
  };
  const handleConfirm = (): void => {
    if (
      code === undefined ||
      confirmation !== code ||
      pending.current === undefined
    )
      return;
    const resolve = pending.current;
    pending.current = undefined;
    clearForm();
    resolve(true);
  };
  const handleCopy = (): void => {
    if (code === undefined || navigator.clipboard === undefined) {
      setFormMessage(t('settings.vault.backupUpgradeCopyUnavailable'));
      return;
    }
    const started = generation.current;
    void navigator.clipboard
      .writeText(code)
      .then(() => {
        if (generation.current === started && pending.current !== undefined)
          setFormMessage(t('settings.vault.backupUpgradeCopied'));
      })
      .catch(() => {
        if (generation.current === started && pending.current !== undefined)
          setFormMessage(t('settings.vault.backupUpgradeCopyUnavailable'));
      });
  };
  const handleDownload = (): void => {
    if (code === undefined) return;
    const url = URL.createObjectURL(
      new Blob([code], { type: recoveryBackupFile.mimeType }),
    );
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = recoveryBackupFile.filename;
      anchor.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };
  return {
    code,
    confirmation,
    qrSvg,
    formMessage,
    qrMarkup: qrSvg === undefined ? undefined : { __html: qrSvg },
    confirmationError:
      confirmation.length > 0 && confirmation !== code
        ? t('settings.vault.rotationBackupMismatch')
        : undefined,
    canConfirm: code !== undefined && confirmation === code,
    handleConfirmationChange: (event): void =>
      setConfirmation(event.target.value),
    handleConfirm,
    handleCopy,
    handleDownload,
    clearForm,
    requestConfirmation,
  };
};
