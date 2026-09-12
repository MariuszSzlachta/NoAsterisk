import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { RotationRecoveryConfirmation } from '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation/types';
import { encryptedPersistence } from '#shared/adapters/persistence';

export const useRotationRecoveryConfirmation =
  (): RotationRecoveryConfirmation => {
    const { t } = useTranslation();
    const [recoveryCode, setRecoveryCode] = useState<string>();
    const [confirmation, setConfirmation] = useState('');
    const pending = useRef<((confirmed: boolean) => void) | undefined>(
      undefined,
    );

    const handleCancel = (): void => {
      const resolve = pending.current;
      pending.current = undefined;
      setRecoveryCode(undefined);
      setConfirmation('');
      resolve?.(false);
    };

    useEffect(() => {
      const unsubscribe = encryptedPersistence.subscribe(() => {
        if (!encryptedPersistence.isUnlocked()) {
          const resolve = pending.current;
          pending.current = undefined;
          setRecoveryCode(undefined);
          setConfirmation('');
          resolve?.(false);
        }
      });
      return () => {
        unsubscribe();
        pending.current?.(false);
        pending.current = undefined;
      };
    }, []);

    const confirmRecoveryCode = (code: string): Promise<boolean> => {
      if (!encryptedPersistence.isUnlocked() || pending.current !== undefined)
        return Promise.resolve(false);
      setRecoveryCode(code);
      setConfirmation('');
      return new Promise<boolean>((resolve) => {
        pending.current = resolve;
      });
    };

    const handleConfirm = (): void => {
      if (recoveryCode === undefined || confirmation !== recoveryCode) return;
      const resolve = pending.current;
      pending.current = undefined;
      setRecoveryCode(undefined);
      setConfirmation('');
      resolve?.(true);
    };

    const handleDownload = (): void => {
      if (recoveryCode === undefined) return;
      const url = URL.createObjectURL(
        new Blob([recoveryCode], {
          type: 'text/plain;charset=utf-8',
        }),
      );
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'budgetflow-recovery.txt';
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    return {
      recoveryCode,
      confirmation,
      canConfirm: recoveryCode !== undefined && confirmation === recoveryCode,
      confirmationError:
        confirmation.length > 0 && confirmation !== recoveryCode
          ? t('settings.vault.rotationBackupMismatch')
          : undefined,
      confirmRecoveryCode,
      handleConfirmationChange: (event): void =>
        setConfirmation(event.target.value),
      handleConfirm,
      handleCancel,
      handleDownload,
    };
  };
