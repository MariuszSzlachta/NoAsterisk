import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encryptedPersistence } from '#shared/adapters/persistence';
import { recoveryCode } from '#shared/adapters/vault-protocol/recovery-code';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { passkeyUnlockApi } from '#shared/api/vault-protocol/passkey-unlock';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    requireVaultSyncMaterial: vi.fn(),
    readVaultLocalShare: vi.fn(),
    verifyVaultVmk: vi.fn(),
    getGeneration: vi.fn(() => 1),
    isUnlocked: vi.fn(() => true),
  },
}));
vi.mock('#shared/adapters/vault-protocol/recovery-code', () => ({
  recoveryCode: { restore: vi.fn() },
}));
vi.mock('#shared/adapters/vault-protocol/vault-protocol', () => ({
  vaultProtocol: { derivePrfKey: vi.fn(), wrapVmk: vi.fn() },
}));
vi.mock('#shared/adapters/webauthn/vault-passkey-ceremony', () => ({
  vaultPasskeyCeremony: { run: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/issue-server-share', () => ({
  issueServerShare: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/passkey-unlock', () => ({
  passkeyUnlockApi: { enable: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: vi.fn() },
}));

describe('passkeyUnlock', () => {
  beforeEach(async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    vi.clearAllMocks();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue({
      syncKey: key,
      signingKey: key,
      verifyKey: key,
      context: {
        accountId: 'account-1',
        workspaceId: 'workspace-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
      },
    });
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      status: 'available',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: 'opaque-device-envelope',
      securityProfile: 'standard',
    });
    vi.mocked(encryptedPersistence.readVaultLocalShare).mockResolvedValue(key);
    vi.mocked(recoveryCode.restore).mockResolvedValue(
      new Uint8Array(32).fill(1),
    );
    vi.mocked(issueServerShare).mockResolvedValue(new Uint8Array(32).fill(2));
    vi.mocked(vaultPasskeyCeremony.run).mockResolvedValue({
      prfKey: key,
      credentialId: 'credential-1',
      assertion: {
        id: 'credential-1',
        rawId: 'raw-id',
        type: 'public-key',
        response: {
          clientDataJSON: 'client',
          authenticatorData: 'auth',
          signature: 'signature',
        },
      },
    });
    vi.mocked(vaultProtocol.derivePrfKey).mockResolvedValue(key);
    vi.mocked(vaultProtocol.wrapVmk).mockResolvedValue({
      header: { purpose: 'passkey-wrap' },
      ciphertext: 'opaque-passkey-envelope',
    });
  });

  it('verifies recovery and sends only the opaque PRF envelope', async () => {
    const { passkeyUnlock } = await import('./passkey-unlock');

    await passkeyUnlock.enable('recovery-code');

    expect(encryptedPersistence.verifyVaultVmk).toHaveBeenCalled();
    expect(passkeyUnlockApi.enable).toHaveBeenCalledWith({
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: JSON.stringify({
        header: { purpose: 'passkey-wrap' },
        ciphertext: 'opaque-passkey-envelope',
      }),
    });
  });

  it('zeroizes the recovered VMK and skips the request after a session change', async () => {
    const vmk = new Uint8Array(32).fill(1);
    vi.mocked(recoveryCode.restore).mockResolvedValue(vmk);
    vi.mocked(encryptedPersistence.getGeneration)
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(1)
      .mockReturnValue(2);

    const { passkeyUnlock } = await import('./passkey-unlock');

    await expect(passkeyUnlock.enable('recovery-code')).rejects.toThrow(
      'Vault operation session changed',
    );
    expect(vmk.every((byte) => byte === 0)).toBe(true);
    expect(passkeyUnlockApi.enable).not.toHaveBeenCalled();
  });

  it('rejects a bootstrap from a different vault context before recovery', async () => {
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      status: 'available',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      vaultId: 'other-vault',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: 'opaque-device-envelope',
      securityProfile: 'standard',
    });

    const { passkeyUnlock } = await import('./passkey-unlock');

    await expect(passkeyUnlock.enable('recovery-code')).rejects.toThrow(
      'Vault device envelope is unavailable',
    );
    expect(recoveryCode.restore).not.toHaveBeenCalled();
    expect(passkeyUnlockApi.enable).not.toHaveBeenCalled();
  });
});
