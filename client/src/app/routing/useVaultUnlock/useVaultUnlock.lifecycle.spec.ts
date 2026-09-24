import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVaultUnlock } from './useVaultUnlock';

const mocks = vi.hoisted(() => ({
  bootstrapGet: vi.fn(),
  consumeHandoff: vi.fn(),
  createRecoveryBackup: vi.fn(),
  createSignedTrustedRequest: vi.fn(),
  enrollVmk: vi.fn(),
  getPersistenceSnapshot: vi.fn(),
  issueServerShare: vi.fn(),
  listDevices: vi.fn(),
  parseSignedTrustedQr: vi.fn(),
  parseSignedTrustedResponse: vi.fn(),
  passkeyRun: vi.fn(),
  readVaultLocalShare: vi.fn(),
  recoverWithCode: vi.fn(),
  recoveryQrRender: vi.fn(),
  renderSignedTrustedQr: vi.fn(),
  restoreSignedTrustedApproval: vi.fn(),
  resumePending: vi.fn(),
  subscribers: new Set<() => void>(),
  trustedPublicKeyIsValid: vi.fn(),
  unlock: vi.fn(),
  unlockWithVaultKeys: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#app/routing/useVaultUnlock/create-signed-trusted-request', () => ({
  createSignedTrustedRequest: mocks.createSignedTrustedRequest,
}));

vi.mock('#app/routing/useVaultUnlock/enroll-vmk', () => ({
  enrollVmk: mocks.enrollVmk,
}));

vi.mock('#app/routing/useVaultUnlock/hydrate-unlocked-vault', () => ({
  hydrateUnlockedVault: vi.fn(),
}));

vi.mock('#app/routing/useVaultUnlock/recover-with-code', () => ({
  recoverWithCode: mocks.recoverWithCode,
}));

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    getSnapshot: mocks.getPersistenceSnapshot,
    readVaultLocalShare: mocks.readVaultLocalShare,
    subscribe: (listener: () => void) => {
      mocks.subscribers.add(listener);
      return () => mocks.subscribers.delete(listener);
    },
    unlockWithVaultKeys: mocks.unlockWithVaultKeys,
  },
}));

vi.mock('#shared/adapters/vault-protocol/recovery-backup', () => ({
  createRecoveryBackup: mocks.createRecoveryBackup,
}));

vi.mock('#shared/adapters/vault-protocol/recovery-qr', () => ({
  recoveryQr: { render: mocks.recoveryQrRender },
}));

vi.mock('#shared/adapters/vault-protocol/signed-trusted-enrollment', () => ({
  parseSignedTrustedResponse: mocks.parseSignedTrustedResponse,
  restoreSignedTrustedApproval: mocks.restoreSignedTrustedApproval,
}));

vi.mock('#shared/adapters/vault-protocol/signed-trusted-qr', () => ({
  parseSignedTrustedQr: mocks.parseSignedTrustedQr,
  renderSignedTrustedQr: mocks.renderSignedTrustedQr,
}));

vi.mock('#shared/adapters/vault-protocol/trusted-device-enrollment', () => ({
  trustedDeviceEnrollment: {
    isP256PublicJwk: mocks.trustedPublicKeyIsValid,
  },
}));

vi.mock('#shared/adapters/vault-protocol/unlock-coordinator', () => ({
  unlockCoordinator: { unlock: mocks.unlock },
}));

vi.mock('#shared/adapters/vault-protocol/vault-rotation', () => ({
  vaultRotation: { resumePending: mocks.resumePending },
}));

vi.mock('#shared/adapters/webauthn/passkey-unlock-handoff', () => ({
  passkeyUnlockHandoff: { consume: mocks.consumeHandoff },
}));

vi.mock('#shared/adapters/webauthn/vault-passkey-ceremony', () => ({
  vaultPasskeyCeremony: { run: mocks.passkeyRun },
}));

vi.mock('#shared/api/vault-protocol/issue-server-share', () => ({
  issueServerShare: mocks.issueServerShare,
}));

vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: mocks.bootstrapGet },
}));

vi.mock('#shared/api/vault-protocol/vault-devices', () => ({
  vaultDevices: { list: mocks.listDevices },
}));

const lockedSnapshot = {
  status: 'locked' as const,
  error: undefined,
  warning: undefined,
  storage: 'unknown' as const,
};

const unlockedSnapshot = {
  ...lockedSnapshot,
  status: 'unlocked' as const,
};

const availableBootstrap = (overrides: Record<string, unknown> = {}) => ({
  status: 'available' as const,
  vaultId: 'vault-1',
  keyId: 'key-1',
  deviceId: 'device-1',
  deviceEnvelope: JSON.stringify({ header: {}, ciphertext: 'device' }),
  ...overrides,
});

const renderSubject = (
  snapshot = unlockedSnapshot,
  accountId = 'account-1',
  workspaceId = 'workspace-1',
) => renderHook(() => useVaultUnlock(snapshot, accountId, workspaceId));

const createDeferred = <Value>() => {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise;
  });

  return { promise, resolve };
};

describe('useVaultUnlock lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.subscribers.clear();
    mocks.bootstrapGet.mockResolvedValue(availableBootstrap());
    mocks.consumeHandoff.mockReturnValue(undefined);
    mocks.readVaultLocalShare.mockResolvedValue({} satisfies CryptoKey);
    mocks.issueServerShare.mockImplementation(async () =>
      new Uint8Array(32).fill(7),
    );
    mocks.unlock.mockImplementation(async () => ({
      local: {} satisfies CryptoKey,
      sync: {} satisfies CryptoKey,
      check: {} satisfies CryptoKey,
      vmk: new Uint8Array(32).fill(9),
    }));
    mocks.unlockWithVaultKeys.mockResolvedValue(undefined);
    mocks.resumePending.mockResolvedValue(false);
    mocks.recoverWithCode.mockResolvedValue(undefined);
    mocks.createRecoveryBackup.mockImplementation(async () => ({
      code: 'BF2:recovery',
      vmk: new Uint8Array([1, 2, 3]),
      recoverySeed: new Uint8Array([4, 5, 6]),
    }));
    mocks.recoveryQrRender.mockResolvedValue('<svg>recovery</svg>');
    mocks.enrollVmk.mockResolvedValue(undefined);
    mocks.listDevices.mockResolvedValue([]);
    mocks.trustedPublicKeyIsValid.mockReturnValue(true);
    mocks.createSignedTrustedRequest.mockResolvedValue({
      request: { requestId: 'request-1' },
      privateKey: {} satisfies CryptoKey,
      prepared: { challenge: 'challenge' },
      signingKeyPair: {} satisfies CryptoKeyPair,
    });
    mocks.renderSignedTrustedQr.mockResolvedValue('<svg>trusted</svg>');
    mocks.parseSignedTrustedQr.mockReturnValue({ encoded: true });
    mocks.parseSignedTrustedResponse.mockReturnValue({ response: true });
    mocks.restoreSignedTrustedApproval.mockImplementation(
      async () => new Uint8Array([8, 8, 8]),
    );
    mocks.getPersistenceSnapshot.mockReturnValue(unlockedSnapshot);
  });

  it('automatically unlocks a standard vault and clears transient key material', async () => {
    const serverShare = new Uint8Array(32).fill(7);
    const vmk = new Uint8Array(32).fill(9);
    mocks.issueServerShare.mockResolvedValue(serverShare);
    mocks.unlock.mockResolvedValue({
      local: {} satisfies CryptoKey,
      sync: {} satisfies CryptoKey,
      check: {} satisfies CryptoKey,
      vmk,
    });

    renderSubject(lockedSnapshot);

    await waitFor(() =>
      expect(mocks.unlockWithVaultKeys).toHaveBeenCalledOnce(),
    );
    expect(mocks.readVaultLocalShare).toHaveBeenCalledOnce();
    expect(mocks.unlock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'standard',
        localShare: expect.anything(),
      }),
    );
    expect(mocks.resumePending).toHaveBeenCalledOnce();
    expect([...vmk]).toEqual([
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(serverShare.every((value) => value === 0)).toBe(true);
  });

  it('uses a high-security passkey ceremony without reading a local share', async () => {
    const prfKey = {} satisfies CryptoKey;
    mocks.bootstrapGet.mockResolvedValue(
      availableBootstrap({
        securityProfile: 'high-security',
        deviceEnvelope: undefined,
        passkeyEnvelope: JSON.stringify({ header: {}, ciphertext: 'passkey' }),
      }),
    );
    mocks.passkeyRun.mockResolvedValue({
      credentialId: 'credential-1',
      prfKey,
    });

    renderSubject(lockedSnapshot);

    await waitFor(() => expect(mocks.unlock).toHaveBeenCalledOnce());
    expect(mocks.readVaultLocalShare).not.toHaveBeenCalled();
    expect(mocks.unlock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'high-security',
        prfKey,
        context: expect.objectContaining({ credentialId: 'credential-1' }),
      }),
    );
  });

  it('falls back to the explicit standard envelope when a passkey ceremony fails', async () => {
    mocks.bootstrapGet.mockResolvedValue(
      availableBootstrap({
        passkeyEnvelope: JSON.stringify({ header: {}, ciphertext: 'passkey' }),
      }),
    );
    mocks.passkeyRun.mockRejectedValue(new Error('cancelled'));

    renderSubject(lockedSnapshot);

    await waitFor(() => expect(mocks.unlock).toHaveBeenCalledOnce());
    expect(mocks.unlock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'standard',
        localShare: expect.anything(),
      }),
    );
  });

  it('fails closed when high-security handoff lacks a PRF key', async () => {
    mocks.bootstrapGet.mockResolvedValue(
      availableBootstrap({
        securityProfile: 'high-security',
        deviceEnvelope: undefined,
        passkeyEnvelope: '{}',
      }),
    );
    mocks.consumeHandoff.mockReturnValue({ credentialId: 'credential-1' });

    const { result } = renderSubject(lockedSnapshot);

    await waitFor(() =>
      expect(result.current.error).toBe('vaultUnlock.errors.failed'),
    );
    expect(mocks.unlock).not.toHaveBeenCalled();
  });

  it('fails closed when the high-security passkey ceremony is rejected', async () => {
    mocks.bootstrapGet.mockResolvedValue(
      availableBootstrap({
        securityProfile: 'high-security',
        deviceEnvelope: undefined,
        passkeyEnvelope: '{}',
      }),
    );
    mocks.passkeyRun.mockRejectedValue(new Error('cancelled'));

    const { result } = renderSubject(lockedSnapshot);

    await waitFor(() =>
      expect(result.current.error).toBe('vaultUnlock.errors.failed'),
    );
    expect(mocks.unlock).not.toHaveBeenCalled();
  });

  it('requires recovery when bootstrap or split authority is unavailable', async () => {
    mocks.bootstrapGet.mockResolvedValueOnce({
      status: 'enrollment-required',
      deviceId: 'device-1',
    });
    const unavailable = renderSubject(lockedSnapshot);
    await waitFor(() =>
      expect(unavailable.result.current.requiresRecovery).toBe(true),
    );
    unavailable.unmount();

    mocks.bootstrapGet.mockResolvedValue(
      availableBootstrap({ deviceEnvelope: undefined }),
    );
    mocks.readVaultLocalShare.mockResolvedValue(undefined);
    const missingShare = renderSubject(lockedSnapshot, 'account-2');
    await waitFor(() =>
      expect(missingShare.result.current.error).toBe(
        'vaultUnlock.errors.failed',
      ),
    );
    expect(mocks.unlock).not.toHaveBeenCalled();
  });

  it('starts a fresh bootstrap after an account switch', async () => {
    const { rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(lockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );

    await waitFor(() =>
      expect(mocks.unlockWithVaultKeys).toHaveBeenCalledOnce(),
    );
    rerender({ accountId: 'account-2' });
    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalledTimes(2));
    expect(mocks.unlockWithVaultKeys).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ accountId: 'account-2' }),
      expect.anything(),
    );
  });

  it('recovers with a code and keeps a retryable error on failure', async () => {
    const { result } = renderSubject();
    act(() => result.current.handleRecoveryCodeChange('BF2:code'));
    act(() => result.current.handleRecovery());

    await waitFor(() => expect(mocks.recoverWithCode).toHaveBeenCalled());
    await waitFor(() => expect(result.current.recoveryCode).toBe(''));

    mocks.recoverWithCode.mockRejectedValueOnce(new Error('invalid'));
    act(() => result.current.handleRecoveryCodeChange('BF2:bad'));
    act(() => result.current.handleRecovery());
    await waitFor(() =>
      expect(result.current.error).toBe('vaultUnlock.errors.recoveryFailed'),
    );
  });

  it('discards a recovery completion from a previous account context', async () => {
    const recovery = createDeferred<void>();
    mocks.recoverWithCode.mockReturnValueOnce(recovery.promise);
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleRecoveryCodeChange('BF2:code'));
    act(() => result.current.handleRecovery());
    await waitFor(() => expect(mocks.recoverWithCode).toHaveBeenCalledOnce());

    rerender({ accountId: 'account-2' });
    await act(async () => {
      recovery.resolve();
      await recovery.promise;
    });

    await waitFor(() => expect(result.current.isUnlocking).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.recoveryCode).toBe('');
  });

  it('cancels recovery through the operation guard after an account switch', async () => {
    const operation = createDeferred<void>();
    mocks.recoverWithCode.mockImplementationOnce(
      async (...args: readonly unknown[]) => {
        await operation.promise;
        (args[4] as () => void)();
      },
    );
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleRecoveryCodeChange('BF2:code'));
    act(() => result.current.handleRecovery());
    await waitFor(() => expect(mocks.recoverWithCode).toHaveBeenCalledOnce());

    rerender({ accountId: 'account-2' });
    await act(async () => {
      operation.resolve();
      await operation.promise;
    });

    await waitFor(() => expect(result.current.isUnlocking).toBe(false));
    expect(result.current.error).toBeUndefined();
  });

  it('creates, renders, copies, downloads and confirms initial recovery setup', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: clipboardWrite } });
    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recovery');
    const revokeObjectUrl = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    const { result } = renderSubject();

    act(() => result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(result.current.recoverySetupCode).toBe('BF2:recovery'),
    );
    await waitFor(() =>
      expect(result.current.recoverySetupQrSvg).toBe('<svg>recovery</svg>'),
    );
    act(() => result.current.handleCopyRecoveryCode());
    expect(clipboardWrite).toHaveBeenCalledWith('BF2:recovery');
    act(() => result.current.handleDownloadRecoveryCode());
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:recovery');

    act(() => result.current.handleConfirmInitialSetup());
    await waitFor(() => expect(mocks.enrollVmk).toHaveBeenCalled());
    await waitFor(() =>
      expect(result.current.recoverySetupCode).toBeUndefined(),
    );
  });

  it('clears pending recovery secrets when the account context changes', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const vmk = new Uint8Array([1, 2]);
    const recoverySeed = new Uint8Array([3, 4]);
    mocks.createRecoveryBackup.mockResolvedValue({
      code: 'BF2:pending',
      vmk,
      recoverySeed,
    });
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(result.current.recoverySetupCode).toBe('BF2:pending'),
    );

    rerender({ accountId: 'account-2' });
    expect([...vmk]).toEqual([0, 0]);
    expect([...recoverySeed]).toEqual([0, 0]);
  });

  it('zeroes setup material created after its account context was cancelled', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const created = {
      code: 'BF2:stale',
      vmk: new Uint8Array([1, 2]),
      recoverySeed: new Uint8Array([3, 4]),
    };
    const backup = createDeferred<typeof created>();
    mocks.createRecoveryBackup.mockReturnValueOnce(backup.promise);
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(mocks.createRecoveryBackup).toHaveBeenCalledOnce(),
    );

    rerender({ accountId: 'account-2' });
    await act(async () => {
      backup.resolve(created);
      await backup.promise;
    });

    await waitFor(() =>
      expect(created.vmk.every((value) => value === 0)).toBe(true),
    );
    expect(created.recoverySeed.every((value) => value === 0)).toBe(true);
    expect(result.current.recoverySetupCode).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('cancels setup before creating key material when bootstrap becomes stale', async () => {
    const bootstrap = createDeferred<{
      readonly status: 'empty';
      readonly deviceId: string;
    }>();
    mocks.bootstrapGet.mockReturnValueOnce(bootstrap.promise);
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleStartInitialSetup());
    await waitFor(() => expect(mocks.bootstrapGet).toHaveBeenCalledOnce());

    rerender({ accountId: 'account-2' });
    await act(async () => {
      bootstrap.resolve({ status: 'empty', deviceId: 'device-1' });
      await bootstrap.promise;
    });

    await waitFor(() => expect(result.current.error).toBeUndefined());
    expect(mocks.createRecoveryBackup).not.toHaveBeenCalled();
  });

  it('cancels setup enrollment through its operation guard', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const enrollment = createDeferred<void>();
    mocks.enrollVmk.mockImplementationOnce(
      async (...args: readonly unknown[]) => {
        await enrollment.promise;
        (args[4] as () => void)();
      },
    );
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(result.current.recoverySetupCode).toBe('BF2:recovery'),
    );
    act(() => result.current.handleConfirmInitialSetup());
    await waitFor(() => expect(mocks.enrollVmk).toHaveBeenCalledOnce());

    rerender({ accountId: 'account-2' });
    await act(async () => {
      enrollment.resolve();
      await enrollment.promise;
    });

    await waitFor(() => expect(result.current.isUnlocking).toBe(false));
    expect(result.current.error).toBeUndefined();
  });

  it('reports initial setup and enrollment failures without discarding a retryable backup', async () => {
    const existing = renderSubject();
    act(() => existing.result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(existing.result.current.error).toBe(
        'vaultUnlock.errors.setupFailed',
      ),
    );
    existing.unmount();

    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    mocks.enrollVmk.mockRejectedValueOnce(new Error('network'));
    const enrollment = renderSubject(unlockedSnapshot, 'account-2');
    act(() => enrollment.result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(enrollment.result.current.recoverySetupCode).toBe('BF2:recovery'),
    );
    act(() => enrollment.result.current.handleConfirmInitialSetup());
    await waitFor(() =>
      expect(enrollment.result.current.error).toBe(
        'vaultUnlock.errors.setupFailed',
      ),
    );
    expect(enrollment.result.current.recoverySetupCode).toBe('BF2:recovery');
  });

  it('handles unavailable recovery-code actions and QR rendering failure', async () => {
    const empty = renderSubject();
    act(() => empty.result.current.handleCopyRecoveryCode());
    act(() => empty.result.current.handleDownloadRecoveryCode());

    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    mocks.recoveryQrRender.mockRejectedValueOnce(new Error('qr'));
    const setup = renderSubject(unlockedSnapshot, 'account-2');
    act(() => setup.result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(setup.result.current.recoverySetupCode).toBe('BF2:recovery'),
    );
    await waitFor(() =>
      expect(mocks.recoveryQrRender).toHaveBeenCalledWith('BF2:recovery'),
    );
    expect(setup.result.current.recoverySetupQrSvg).toBeUndefined();
  });

  it('completes trusted-device enrollment and zeroes the transferred VMK', async () => {
    mocks.listDevices.mockResolvedValue([
      {
        deviceId: 'trusted-device',
        vaultId: 'vault-1',
        keyId: 'key-1',
        status: 'active',
        signingPublicKey: JSON.stringify({ kty: 'EC', crv: 'P-256' }),
      },
    ]);
    const transferredVmk = new Uint8Array([8, 8, 8]);
    mocks.restoreSignedTrustedApproval.mockResolvedValue(transferredVmk);
    const { result } = renderSubject();

    act(() => result.current.handleStartTrustedDeviceEnrollment());
    await waitFor(() =>
      expect(result.current.trustedDeviceFlow).toBe('show-request'),
    );
    expect(result.current.trustedDeviceRequestQrSvg).toBe('<svg>trusted</svg>');
    act(() => result.current.handleStartTrustedDeviceResponseScan());
    expect(result.current.trustedDeviceFlow).toBe('scan-response');
    act(() =>
      result.current.handleTrustedDeviceResponseScan('signed-response'),
    );
    await waitFor(() => expect(result.current.trustedDeviceFlow).toBe('idle'));
    expect(mocks.parseSignedTrustedQr).toHaveBeenCalledWith('signed-response');
    expect(mocks.enrollVmk).toHaveBeenCalledWith(
      'account-1',
      'workspace-1',
      expect.anything(),
      transferredVmk,
      expect.any(Function),
      expect.objectContaining({ purpose: 'trusted' }),
    );
    expect([...transferredVmk]).toEqual([0, 0, 0]);
  });

  it('surfaces trusted-device errors and supports explicit cancellation', async () => {
    const { result } = renderSubject();
    act(() => result.current.handleStartTrustedDeviceEnrollment());
    await waitFor(() =>
      expect(result.current.trustedDeviceError).toBe(
        'vaultUnlock.trustedDeviceError',
      ),
    );
    act(() => result.current.handleTrustedDeviceError());
    expect(result.current.trustedDeviceError).toBe(
      'vaultUnlock.trustedDeviceError',
    );
    act(() => result.current.handleCancelTrustedDeviceEnrollment());
    expect(result.current.trustedDeviceFlow).toBe('idle');
    expect(result.current.trustedDeviceError).toBeUndefined();
  });

  it('rejects trusted enrollment when vault authority is unavailable', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const { result } = renderSubject();

    act(() => result.current.handleStartTrustedDeviceEnrollment());

    await waitFor(() =>
      expect(result.current.trustedDeviceError).toBe(
        'vaultUnlock.trustedDeviceError',
      ),
    );
    expect(mocks.listDevices).not.toHaveBeenCalled();
  });

  it('discards trusted-device discovery completed after an account switch', async () => {
    const devices = createDeferred<readonly unknown[]>();
    mocks.listDevices.mockReturnValueOnce(devices.promise);
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleStartTrustedDeviceEnrollment());
    await waitFor(() => expect(mocks.listDevices).toHaveBeenCalledOnce());

    rerender({ accountId: 'account-2' });
    await act(async () => {
      devices.resolve([]);
      await devices.promise;
    });

    await waitFor(() => expect(result.current.trustedDeviceFlow).toBe('idle'));
    expect(result.current.trustedDeviceError).toBeUndefined();
  });

  it('discards a trusted-device QR rendered after an account switch', async () => {
    mocks.listDevices.mockResolvedValue([
      {
        deviceId: 'trusted-device',
        vaultId: 'vault-1',
        keyId: 'key-1',
        status: 'active',
        signingPublicKey: JSON.stringify({ kty: 'EC', crv: 'P-256' }),
      },
    ]);
    const qr = createDeferred<string>();
    mocks.renderSignedTrustedQr.mockReturnValueOnce(qr.promise);
    const { result, rerender } = renderHook(
      ({ accountId }: { readonly accountId: string }) =>
        useVaultUnlock(unlockedSnapshot, accountId, 'workspace-1'),
      { initialProps: { accountId: 'account-1' } },
    );
    act(() => result.current.handleStartTrustedDeviceEnrollment());
    await waitFor(() =>
      expect(mocks.renderSignedTrustedQr).toHaveBeenCalledOnce(),
    );

    rerender({ accountId: 'account-2' });
    await act(async () => {
      qr.resolve('<svg>stale</svg>');
      await qr.promise;
    });

    await waitFor(() => expect(result.current.trustedDeviceFlow).toBe('idle'));
    expect(result.current.trustedDeviceRequestQrSvg).toBeUndefined();
    expect(result.current.trustedDeviceError).toBeUndefined();
  });

  it('surfaces a trusted approval restoration failure without enrolling', async () => {
    mocks.listDevices.mockResolvedValue([
      {
        deviceId: 'trusted-device',
        vaultId: 'vault-1',
        keyId: 'key-1',
        status: 'active',
        signingPublicKey: JSON.stringify({ kty: 'EC', crv: 'P-256' }),
      },
    ]);
    mocks.restoreSignedTrustedApproval.mockRejectedValueOnce(
      new Error('invalid approval'),
    );
    const { result } = renderSubject();
    act(() => result.current.handleStartTrustedDeviceEnrollment());
    await waitFor(() =>
      expect(result.current.trustedDeviceFlow).toBe('show-request'),
    );

    act(() =>
      result.current.handleTrustedDeviceResponseScan('signed-response'),
    );

    await waitFor(() =>
      expect(result.current.trustedDeviceError).toBe(
        'vaultUnlock.trustedDeviceError',
      ),
    );
    expect(mocks.enrollVmk).not.toHaveBeenCalled();
  });

  it('ignores guarded actions before their required state exists', () => {
    const { result } = renderSubject();

    act(() => result.current.handleRecovery());
    act(() => result.current.handleConfirmInitialSetup());
    act(() => result.current.handleStartTrustedDeviceResponseScan());
    act(() => result.current.handleTrustedDeviceResponseScan('response'));

    expect(mocks.recoverWithCode).not.toHaveBeenCalled();
    expect(mocks.enrollVmk).not.toHaveBeenCalled();
    expect(mocks.parseSignedTrustedQr).not.toHaveBeenCalled();
    expect(result.current.trustedDeviceFlow).toBe('idle');
  });

  it('rejects an invalid trusted signing key and a malformed approval response', async () => {
    mocks.listDevices.mockResolvedValue([
      {
        deviceId: 'trusted-device',
        vaultId: 'vault-1',
        keyId: 'key-1',
        status: 'active',
        signingPublicKey: '{}',
      },
    ]);
    mocks.trustedPublicKeyIsValid.mockReturnValueOnce(false);
    const invalidKey = renderSubject();
    act(() => invalidKey.result.current.handleStartTrustedDeviceEnrollment());
    await waitFor(() =>
      expect(invalidKey.result.current.trustedDeviceError).toBe(
        'vaultUnlock.trustedDeviceError',
      ),
    );
    invalidKey.unmount();

    mocks.trustedPublicKeyIsValid.mockReturnValue(true);
    const invalidResponse = renderSubject(unlockedSnapshot, 'account-2');
    act(() =>
      invalidResponse.result.current.handleStartTrustedDeviceEnrollment(),
    );
    await waitFor(() =>
      expect(invalidResponse.result.current.trustedDeviceFlow).toBe(
        'show-request',
      ),
    );
    mocks.parseSignedTrustedQr.mockImplementationOnce(() => {
      throw new Error('malformed');
    });
    act(() =>
      invalidResponse.result.current.handleTrustedDeviceResponseScan('bad'),
    );
    await waitFor(() =>
      expect(invalidResponse.result.current.trustedDeviceError).toBe(
        'vaultUnlock.trustedDeviceError',
      ),
    );
  });

  it('cancels sensitive pending state when persistence locks', async () => {
    mocks.bootstrapGet.mockResolvedValue({
      status: 'empty',
      deviceId: 'device-1',
    });
    const vmk = new Uint8Array([1, 2]);
    const recoverySeed = new Uint8Array([3, 4]);
    mocks.createRecoveryBackup.mockResolvedValue({
      code: 'BF2:pending',
      vmk,
      recoverySeed,
    });
    const { result } = renderSubject();
    act(() => result.current.handleStartInitialSetup());
    await waitFor(() =>
      expect(result.current.recoverySetupCode).toBe('BF2:pending'),
    );
    mocks.getPersistenceSnapshot.mockReturnValue({
      ...lockedSnapshot,
      status: 'error',
      error: 'locked',
    });

    act(() => {
      for (const listener of mocks.subscribers) listener();
    });

    expect(result.current.recoverySetupCode).toBeUndefined();
    expect([...vmk]).toEqual([0, 0]);
    expect([...recoverySeed]).toEqual([0, 0]);
  });

  it('ignores unrelated persistence notifications and maps snapshot errors', () => {
    const { result } = renderSubject({
      ...unlockedSnapshot,
      error: 'persistence failure',
    });
    act(() => {
      for (const listener of mocks.subscribers) listener();
    });
    expect(result.current.error).toBe('vaultUnlock.errors.failed');
  });
});
