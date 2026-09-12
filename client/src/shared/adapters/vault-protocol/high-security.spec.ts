import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encryptedPersistence } from '#shared/adapters/persistence';
import { highSecurity } from '#shared/adapters/vault-protocol/high-security';
import { recoveryCode } from '#shared/adapters/vault-protocol/recovery-code';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultSecurity } from '#shared/api/vault-protocol/vault-security';

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    removeVaultLocalShare: vi.fn(),
    storeVaultLocalShare: vi.fn(),
  },
}));
vi.mock('#shared/adapters/vault-protocol/vault-protocol', () => ({
  vaultProtocol: {
    unwrapVmk: vi.fn(),
    derivePrfKey: vi.fn(),
    generateLocalShare: vi.fn(),
    deriveDeviceKey: vi.fn(),
    wrapVmk: vi.fn(),
  },
}));
vi.mock('#shared/adapters/vault-protocol/recovery-code', () => ({
  recoveryCode: { restore: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/vault-security', () => ({
  vaultSecurity: { enableHighSecurity: vi.fn(), disableHighSecurity: vi.fn() },
}));

describe('highSecurity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('commits the PRF envelope before deleting LocalShare', async () => {
    const vmk = new Uint8Array(32).fill(4);
    const serverShare = new Uint8Array(32).fill(8);
    const context = {
      accountId: 'account-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      credentialId: 'credential-1',
    };
    vi.mocked(vaultProtocol.deriveDeviceKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.unwrapVmk).mockResolvedValue(vmk);
    vi.mocked(recoveryCode.restore).mockResolvedValue(vmk.slice());
    vi.mocked(vaultProtocol.derivePrfKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.wrapVmk).mockResolvedValue({
      header: { purpose: 'passkey-wrap' },
      ciphertext: 'opaque',
    });

    await highSecurity.enable({
      context,
      localShare: {} as CryptoKey,
      serverShare,
      deviceEnvelope: { header: {}, ciphertext: 'device' },
      prfKey: {} as CryptoKey,
      recoveryCode: 'recovery-code',
    });

    expect(vaultSecurity.enableHighSecurity).toHaveBeenCalledWith({
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: JSON.stringify({
        header: { purpose: 'passkey-wrap' },
        ciphertext: 'opaque',
      }),
    });
    expect(encryptedPersistence.removeVaultLocalShare).toHaveBeenCalledWith(context);
    expect(serverShare.every((value) => value === 0)).toBe(true);
    expect(vmk.every((value) => value === 0)).toBe(true);
  });

  it('does not delete LocalShare when the server transition fails', async () => {
    const serverShare = new Uint8Array(32).fill(8);
    vi.mocked(vaultProtocol.deriveDeviceKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.unwrapVmk).mockResolvedValue(new Uint8Array(32));
    vi.mocked(recoveryCode.restore).mockResolvedValue(new Uint8Array(32));
    vi.mocked(vaultProtocol.derivePrfKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.wrapVmk).mockResolvedValue({
      header: {},
      ciphertext: 'opaque',
    });
    vi.mocked(vaultSecurity.enableHighSecurity).mockRejectedValue(new Error('step-up-required'));

    await expect(
      highSecurity.enable({
        context: {
          accountId: 'account-1',
          workspaceId: 'workspace-1',
          vaultId: 'vault-1',
          keyId: 'key-1',
          deviceId: 'device-1',
          credentialId: 'credential-1',
        },
        localShare: {} as CryptoKey,
        serverShare,
        deviceEnvelope: { header: {}, ciphertext: 'device' },
        prfKey: {} as CryptoKey,
        recoveryCode: 'recovery-code',
      }),
    ).rejects.toThrow('step-up-required');
    expect(encryptedPersistence.removeVaultLocalShare).not.toHaveBeenCalled();
    expect(serverShare.every((value) => value === 0)).toBe(true);
  });

  it('does not contact the server when recovery does not match the active VMK', async () => {
    const serverShare = new Uint8Array(32).fill(8);
    vi.mocked(vaultProtocol.deriveDeviceKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.unwrapVmk).mockResolvedValue(new Uint8Array(32));
    vi.mocked(recoveryCode.restore).mockResolvedValue(
      new Uint8Array(32).fill(1),
    );

    await expect(
      highSecurity.enable({
        context: {
          accountId: 'account-1',
          workspaceId: 'workspace-1',
          vaultId: 'vault-1',
          keyId: 'key-1',
          deviceId: 'device-1',
          credentialId: 'credential-1',
        },
        localShare: {} as CryptoKey,
        serverShare,
        deviceEnvelope: { header: {}, ciphertext: 'device' },
        prfKey: {} as CryptoKey,
        recoveryCode: 'recovery-code',
      }),
    ).rejects.toThrow('Recovery confirmation failed');
    expect(vaultSecurity.enableHighSecurity).not.toHaveBeenCalled();
    expect(encryptedPersistence.removeVaultLocalShare).not.toHaveBeenCalled();
  });

  it('restores LocalShare only after disabling high-security on the server', async () => {
    const vmk = new Uint8Array(32).fill(4);
    const serverShare = new Uint8Array(32).fill(8);
    const localShare = {} as CryptoKey;
    const context = {
      accountId: 'account-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      credentialId: 'credential-1',
    };
    vi.mocked(vaultProtocol.unwrapVmk).mockResolvedValue(vmk);
    vi.mocked(vaultProtocol.derivePrfKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.generateLocalShare).mockResolvedValue(localShare);
    vi.mocked(vaultProtocol.deriveDeviceKey).mockResolvedValue({} as CryptoKey);
    vi.mocked(vaultProtocol.wrapVmk).mockResolvedValue({
      header: { purpose: 'device-wrap' },
      ciphertext: 'device-envelope',
    });
    vi.mocked(recoveryCode.restore).mockResolvedValue(vmk.slice());

    await highSecurity.disable({
      context,
      serverShare,
      passkeyEnvelope: { header: {}, ciphertext: 'passkey' },
      prfKey: {} as CryptoKey,
      recoveryCode: 'recovery-code',
    });

    expect(vaultSecurity.disableHighSecurity).toHaveBeenCalledWith({
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      deviceEnvelope: JSON.stringify({
        header: { purpose: 'device-wrap' },
        ciphertext: 'device-envelope',
      }),
    });
    expect(encryptedPersistence.storeVaultLocalShare).toHaveBeenCalledWith(
      expect.not.objectContaining({ credentialId: expect.any(String) }),
      localShare,
    );
  });
});
