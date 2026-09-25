import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useRecoveryBackupForm } from '#features/user-settings/ui/hooks/useRecoveryBackupForm';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup';
import { productIdentity } from '#shared/config/product-identity/product-identity';

describe('useRecoveryBackupForm', () => {
  afterEach(() => vi.restoreAllMocks());

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

  it('downloads a backup using the canonical product filename', async () => {
    const code = await encodeRecoveryBackup({
      vmk: new Uint8Array(32),
      recoverySeed: new Uint8Array(32).fill(1),
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recovery');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const hook = renderHook(useRecoveryBackupForm);

    act(() => {
      void hook.result.current.requestConfirmation(code, () => true);
    });
    act(() => hook.result.current.handleDownload());

    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.instances[0]).toHaveProperty(
      'download',
      productIdentity.recoveryFilename,
    );
    hook.unmount();
  });
});
