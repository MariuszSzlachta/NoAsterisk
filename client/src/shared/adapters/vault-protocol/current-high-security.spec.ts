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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(encryptedPersistence.requireVaultSyncMaterial).mockReturnValue({
      syncKey: {},
      signingKey: {},
      verifyKey: {},
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
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: '{"header":{},"ciphertext":"device"}',
      passkeyEnvelope: '{"header":{},"ciphertext":"passkey"}',
      securityProfile: 'high-security',
    });
    vi.mocked(encryptedPersistence.readVaultLocalShare).mockResolvedValue({});
    vi.mocked(issueServerShare).mockResolvedValue(new Uint8Array(32));
    vi.mocked(vaultPasskeyCeremony.run).mockResolvedValue({
      credentialId: 'credential-1',
      prfKey: {},
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
      undefined,
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
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: '{"header":{},"ciphertext":"device"}',
    });

    await expect(currentHighSecurity.disable('recovery-code')).rejects.toThrow(
      'High-security envelope is unavailable',
    );
    expect(highSecurity.disable).not.toHaveBeenCalled();
  });
});
