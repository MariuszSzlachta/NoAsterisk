import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { webauthnCredentials } from '#shared/api/vault-protocol/webauthn-credentials';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));
vi.mock('#shared/adapters/webauthn/allowlisted-webauthn-dto', () => ({
  allowlistedWebauthnDto: { serializeRegistration: vi.fn(() => ({ id: 'credential', rawId: 'raw', type: 'public-key', response: { clientDataJSON: 'client', attestationObject: 'attestation' } })) },
}));

describe('webauthnCredentials', () => {
  it('uses explicit registration fields and forwards only the allowlisted DTO', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({
      challenge: 'Y2hhbGxlbmdl',
      rp: { name: 'BudgetFlow', id: 'localhost' },
      user: { id: 'dXNlcg', name: 'user@example.com', displayName: 'User' },
      pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    });
    const credential = {
      id: 'credential',
      response: {},
    } satisfies unknown satisfies Credential;
    vi.stubGlobal('navigator', { credentials: { create: vi.fn().mockResolvedValue(credential) } });

    await webauthnCredentials.register({ vaultId: 'vault-1', deviceId: 'device-1' });

    expect(apiClient.post).toHaveBeenNthCalledWith(
      2,
      '/users/me/vault/webauthn/credentials/registration/verify',
      expect.objectContaining({
        challenge: 'Y2hhbGxlbmdl',
        credential: expect.objectContaining({ id: 'credential' }),
      }),
    );
  });
});
