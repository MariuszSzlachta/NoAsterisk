import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useRotationRecoveryConfirmation } from '#features/user-settings/ui/hooks/useRotationRecoveryConfirmation';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { productIdentity } from '#shared/config/product-identity/product-identity';

const code = 'local-recovery-fixture';
describe('useRotationRecoveryConfirmation', () => {
  beforeEach(() => {
    vi.spyOn(encryptedPersistence, 'isUnlocked').mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should cancel without approving the backup when the dialog is closed', async () => {
    const { result } = renderHook(() => useRotationRecoveryConfirmation());
    let backup: Promise<boolean> | undefined;
    act(() => {
      backup = result.current.confirmRecoveryCode(code);
    });
    expect(result.current.recoveryCode).toBe(code);
    act(() => result.current.handleCancel());
    await expect(backup).resolves.toBe(false);
    expect(result.current.recoveryCode).toBeUndefined();
  });

  it('should discard the secret and cancel when the vault locks', async () => {
    let notify: (() => void) | undefined;
    vi.spyOn(encryptedPersistence, 'subscribe').mockImplementation(
      (listener) => {
        notify = listener;
        return () => undefined;
      },
    );
    const { result } = renderHook(() => useRotationRecoveryConfirmation());
    let backup: Promise<boolean> | undefined;
    act(() => {
      backup = result.current.confirmRecoveryCode(code);
    });
    vi.mocked(encryptedPersistence.isUnlocked).mockReturnValue(false);
    act(() => notify?.());
    await expect(backup).resolves.toBe(false);
    expect(result.current.recoveryCode).toBeUndefined();
  });

  it('should resolve an outstanding confirmation when its screen unmounts', async () => {
    const { result, unmount } = renderHook(() =>
      useRotationRecoveryConfirmation(),
    );
    let backup: Promise<boolean> | undefined;
    act(() => {
      backup = result.current.confirmRecoveryCode(code);
    });
    unmount();
    await expect(backup).resolves.toBe(false);
  });

  it('should refuse another confirmation when one is already pending', async () => {
    const { result } = renderHook(() => useRotationRecoveryConfirmation());
    let first: Promise<boolean> | undefined;
    act(() => {
      first = result.current.confirmRecoveryCode(code);
    });
    await expect(result.current.confirmRecoveryCode('another')).resolves.toBe(
      false,
    );
    expect(result.current.recoveryCode).toBe(code);
    act(() => result.current.handleCancel());
    await expect(first).resolves.toBe(false);
  });

  it('downloads a rotated backup using the canonical product filename', () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:recovery');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const { result } = renderHook(() => useRotationRecoveryConfirmation());

    act(() => {
      void result.current.confirmRecoveryCode(code);
    });
    act(() => result.current.handleDownload());

    expect(click).toHaveBeenCalledOnce();
    expect(click.mock.instances[0]).toHaveProperty(
      'download',
      productIdentity.recoveryFilename,
    );
    act(() => result.current.handleCancel());
  });
});
