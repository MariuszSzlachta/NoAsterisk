import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRecoveryBackupUpgradeMutation } from '#features/user-settings/api/useRecoveryBackupUpgradeMutation';
import type { RecoveryBackupUpgradeOutcome } from '#features/user-settings/model/recovery-backup-upgrade/types';
import { useRecoveryBackupUpgradeStore } from '#features/user-settings/store/useRecoveryBackupUpgradeStore';
import { useRecoveryBackupOperation } from '#features/user-settings/ui/hooks/useRecoveryBackupOperation';

vi.mock('#features/user-settings/api/useRecoveryBackupUpgradeMutation', () => ({
  useRecoveryBackupUpgradeMutation: vi.fn(),
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    getGeneration: () => 1,
    isUnlocked: () => true,
    subscribe: () => () => {},
  },
}));
beforeEach(() => {
  vi.resetAllMocks();
  useRecoveryBackupUpgradeStore.getState().reset();
});
describe('useRecoveryBackupOperation', () => {
  it('should prevent duplicate submissions and discard late success after cancellation', async () => {
    let finish: ((outcome: RecoveryBackupUpgradeOutcome) => void) | undefined;
    const register = vi.fn(
      () =>
        new Promise<RecoveryBackupUpgradeOutcome>((resolve) => {
          finish = resolve;
        }),
    );
    vi.mocked(useRecoveryBackupUpgradeMutation).mockReturnValue({
      registerBackup: register,
    });
    const hook = renderHook(() =>
      useRecoveryBackupOperation({
        canStart: true,
        clearForm: () => {},
        requestConfirmation: async () => false,
      }),
    );
    act(() => {
      hook.result.current.handleStart();
      hook.result.current.handleStart();
    });
    expect(register).toHaveBeenCalledTimes(1);
    expect(hook.result.current.phase).toBe('working');
    await act(async () => {
      hook.result.current.handleCancel();
      finish?.('registered');
      await Promise.resolve();
    });
    expect(hook.result.current.phase).toBe('idle');
    hook.unmount();
  });
});
