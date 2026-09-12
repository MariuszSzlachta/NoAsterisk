import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { vaultSecurity } from '#shared/api/vault-protocol/vault-security';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));

describe('vaultSecurity', () => {
  beforeEach(() => vi.clearAllMocks());

  it('adds an explicit recovery confirmation to high-security enablement', async () => {
    await vaultSecurity.enableHighSecurity({
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: '{"header":{},"ciphertext":"opaque"}',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/security/high-security/enable',
      expect.objectContaining({
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
        passkeyEnvelope: '{"header":{},"ciphertext":"opaque"}',
        recoveryConfirmed: true,
      }),
    );
  });

  it('sends only the opaque fallback envelope when disabling high-security', async () => {
    await vaultSecurity.disableHighSecurity({
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      deviceEnvelope: '{"header":{},"ciphertext":"opaque-device"}',
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/security/high-security/disable',
      {
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
        deviceEnvelope: '{"header":{},"ciphertext":"opaque-device"}',
        recoveryConfirmed: true,
      },
    );
  });
});
