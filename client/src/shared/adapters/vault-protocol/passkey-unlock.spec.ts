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
      deviceEnvelope: 'opaque-device-envelope',
    });
    vi.mocked(encryptedPersistence.readVaultLocalShare).mockResolvedValue({});
    vi.mocked(recoveryCode.restore).mockResolvedValue(
      new Uint8Array(32).fill(1),
    );
    vi.mocked(issueServerShare).mockResolvedValue(new Uint8Array(32).fill(2));
    vi.mocked(vaultPasskeyCeremony.run).mockResolvedValue({
      prfKey: {},
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
    vi.mocked(vaultProtocol.derivePrfKey).mockResolvedValue({});
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
});
