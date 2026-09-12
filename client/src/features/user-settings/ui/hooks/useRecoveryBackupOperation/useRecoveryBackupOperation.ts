import { useEffect, useRef } from 'react';

import { useRecoveryBackupUpgradeMutation } from '#features/user-settings/api/useRecoveryBackupUpgradeMutation';
import { useRecoveryBackupUpgradeStore } from '#features/user-settings/store/useRecoveryBackupUpgradeStore';
import type {
  RecoveryBackupOperation,
  RecoveryBackupOperationInput,
} from '#features/user-settings/ui/hooks/useRecoveryBackupOperation/types';
import { encryptedPersistence } from '#shared/adapters/persistence';

export const useRecoveryBackupOperation = (
  form: RecoveryBackupOperationInput,
): RecoveryBackupOperation => {
  const { registerBackup } = useRecoveryBackupUpgradeMutation();
  const phase = useRecoveryBackupUpgradeStore((state) => state.phase);
  const setPhase = useRecoveryBackupUpgradeStore((state) => state.setPhase);
  const reset = useRecoveryBackupUpgradeStore((state) => state.reset);
  const formRef = useRef(form);
  formRef.current = form;
  const operation = useRef({ generation: 0, isBusy: false, isMounted: true });

  const handleCancel = (): void => {
    operation.current.generation += 1;
    operation.current.isBusy = false;
    form.clearForm();
    reset();
  };
  useEffect(() => {
    const lifecycle = operation.current;
    lifecycle.isMounted = true;
    reset();
    const sessionGeneration = encryptedPersistence.getGeneration();
    const unsubscribe = encryptedPersistence.subscribe(() => {
      if (
        !encryptedPersistence.isUnlocked() ||
        encryptedPersistence.getGeneration() !== sessionGeneration
      ) {
        lifecycle.generation += 1;
        lifecycle.isBusy = false;
        formRef.current.clearForm();
        reset();
      }
    });
    return () => {
      unsubscribe();
      lifecycle.isMounted = false;
      lifecycle.generation += 1;

      reset();
    };
  }, [reset]);

  const handleStart = (): void => {
    if (operation.current.isBusy || !form.canStart || phase === 'completed')
      return;
    const started = ++operation.current.generation;
    operation.current.isBusy = true;
    setPhase('working');
    form.clearForm();
    const assertCurrent = (): void => {
      if (
        !operation.current.isMounted ||
        operation.current.generation !== started
      )
        throw new Error('Recovery upgrade flow invalidated');
    };
    void registerBackup({
      confirmBackup: async (backup) => {
        assertCurrent();
        return form.requestConfirmation(
          backup,
          () =>
            operation.current.isMounted &&
            operation.current.generation === started,
        );
      },
      assertCurrent,
    })
      .then((result) => {
        assertCurrent();
        form.clearForm();
        setPhase(result === 'cancelled' ? 'idle' : 'completed');
      })
      .catch(() => {
        if (
          operation.current.isMounted &&
          operation.current.generation === started
        ) {
          form.clearForm();
          setPhase('failed');
        }
      })
      .finally(() => {
        if (
          operation.current.isMounted &&
          operation.current.generation === started
        ) {
          operation.current.isBusy = false;
        }
      });
  };
  return { phase, handleStart, handleCancel };
};
