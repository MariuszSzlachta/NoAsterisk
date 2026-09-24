import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encryptedPersistence } from '#shared/adapters/persistence';
import { currentHighSecurity } from '#shared/adapters/vault-protocol/current-high-security';
import { highSecurity } from '#shared/adapters/vault-protocol/high-security';
import { vaultPasskeyCeremony } from '#shared/adapters/webauthn/vault-passkey-ceremony';
import { issueServerShare } from '#shared/api/vault-protocol/issue-server-share';
import { vaultBootstrap } from '#shared/api/vault-protocol/vault-bootstrap';

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    requireVaultSyncMaterial: vi.fn(),
    readVaultLocalShare: vi.fn(),
    getGeneration: vi.fn(() => 1),
    isUnlocked: vi.fn(() => true),
  },
}));
vi.mock('#shared/adapters/vault-protocol/high-security', () => ({
  highSecurity: { enable: vi.fn(), disable: vi.fn() },
}));
vi.mock('#shared/adapters/webauthn/vault-passkey-ceremony', () => ({
  vaultPasskeyCeremony: { run: vi.fn() },
}));
vi.mock('#shared/api/vault-protocol/issue-server-share', () => ({
  issueServerShare: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/vault-bootstrap', () => ({
  vaultBootstrap: { get: vi.fn() },
}));

describe('currentHighSecurity', () => {
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
      deviceEnvelope: '{"header":{},"ciphertext":"device"}',
      passkeyEnvelope: '{"header":{},"ciphertext":"passkey"}',
      securityProfile: 'high-security',
    });
    vi.mocked(encryptedPersistence.readVaultLocalShare).mockResolvedValue(key);
    vi.mocked(issueServerShare).mockResolvedValue(new Uint8Array(32));
    vi.mocked(vaultPasskeyCeremony.run).mockResolvedValue({
      credentialId: 'credential-1',
      prfKey: key,
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
  });

  it('runs a PRF ceremony and delegates high-security enablement', async () => {
    await currentHighSecurity.enable('recovery-code');

    expect(vaultPasskeyCeremony.run).toHaveBeenCalledWith(
      expect.objectContaining({ keyId: 'key-1' }),
    );
    expect(highSecurity.enable).toHaveBeenCalledWith(
      expect.objectContaining({
        recoveryCode: 'recovery-code',
        context: expect.objectContaining({ credentialId: 'credential-1' }),
      }),
    );
  });

  it('requires the passkey envelope when disabling high-security', async () => {
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      status: 'available',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: '{"header":{},"ciphertext":"device"}',
      securityProfile: 'standard',
    });

    await expect(currentHighSecurity.disable('recovery-code')).rejects.toThrow(
      'High-security envelope is unavailable',
    );
    expect(highSecurity.disable).not.toHaveBeenCalled();
  });

  it('rejects a session change before enabling high-security', async () => {
    vi.mocked(encryptedPersistence.getGeneration)
      .mockReturnValueOnce(1)
      .mockReturnValue(2);

    await expect(currentHighSecurity.enable('recovery-code')).rejects.toThrow(
      'Vault operation session changed',
    );
    expect(highSecurity.enable).not.toHaveBeenCalled();
  });

  it('rejects a bootstrap from a different vault context', async () => {
    vi.mocked(vaultBootstrap.get).mockResolvedValue({
      status: 'available',
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      vaultId: 'other-vault',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: '{"header":{},"ciphertext":"device"}',
      securityProfile: 'high-security',
    });

    await expect(currentHighSecurity.enable('recovery-code')).rejects.toThrow(
      'Vault device envelope is unavailable',
    );
    expect(vaultPasskeyCeremony.run).not.toHaveBeenCalled();
    expect(highSecurity.enable).not.toHaveBeenCalled();
  });
});
