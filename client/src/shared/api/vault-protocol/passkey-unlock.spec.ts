import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '#shared/api';
import { passkeyUnlockApi } from '#shared/api/vault-protocol/passkey-unlock';

vi.mock('#shared/api', () => ({
  apiClient: { post: vi.fn() },
}));

describe('passkeyUnlockApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends only the opaque envelope and public context', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(undefined);

    await passkeyUnlockApi.enable({
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: '{"header":{},"ciphertext":"opaque"}',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/security/passkey/enable',
      {
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
        passkeyEnvelope: '{"header":{},"ciphertext":"opaque"}',
        recoveryConfirmed: true,
      },
    );
  });
});
