import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRecoveryBackupForm } from '#features/user-settings/ui/hooks/useRecoveryBackupForm';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';

describe('useRecoveryBackupForm', () => {
  it('should resolve cancellation and clear the code when dismissed', async () => {
    const code = await encodeRecoveryBackup({
      vmk: new Uint8Array(32),
      recoverySeed: new Uint8Array(32).fill(1),
    });
    const hook = renderHook(useRecoveryBackupForm);
    let confirmation: Promise<boolean> | undefined;
    act(() => {
      confirmation = hook.result.current.requestConfirmation(code, () => true);
    });
    expect(hook.result.current.code).toBe(code);
    act(() => {
      hook.result.current.clearForm();
    });
    await expect(confirmation).resolves.toBe(false);
    expect(hook.result.current.code).toBeUndefined();
    expect(hook.result.current.confirmation).toBe('');
    expect(hook.result.current.qrSvg).toBeUndefined();
    hook.unmount();
  });
  it('should resolve pending confirmation as cancelled on unmount', async () => {
    const code = await encodeRecoveryBackup({
      vmk: new Uint8Array(32),
      recoverySeed: new Uint8Array(32).fill(1),
    });
    const hook = renderHook(useRecoveryBackupForm);
    let confirmation: Promise<boolean> | undefined;
    act(() => {
      confirmation = hook.result.current.requestConfirmation(code, () => true);
    });
    hook.unmount();
    await expect(confirmation).resolves.toBe(false);
  });
});
