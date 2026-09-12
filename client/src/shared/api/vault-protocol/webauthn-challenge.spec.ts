import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '#shared/api';
import { webauthnChallenge } from '#shared/api/vault-protocol/webauthn-challenge';

vi.mock('#shared/api', () => ({ apiClient: { post: vi.fn() } }));

describe('webauthnChallenge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('decodes a server challenge without exposing the response object', async () => {
    const challenge = new Uint8Array(32).fill(7);
    const encoded = btoa(String.fromCharCode(...challenge))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    vi.mocked(apiClient.post).mockResolvedValue({
      challenge: encoded,
      expiresAt: new Date(Date.now() + 30_000).toISOString(),
      type: 'authentication',
      userVerification: 'required',
    });

    await expect(
      webauthnChallenge.createAuthenticationChallenge('vault-1', 'device-1'),
    ).resolves.toEqual(challenge);
    expect(apiClient.post).toHaveBeenCalledWith(
      '/users/me/vault/webauthn/challenge',
      { vaultId: 'vault-1', deviceId: 'device-1', type: 'authentication' },
    );
  });

  it('rejects malformed or incorrectly sized challenges', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({
      challenge: 'not-base64url',
      expiresAt: new Date().toISOString(),
      type: 'authentication',
      userVerification: 'required',
    });

    await expect(
      webauthnChallenge.createAuthenticationChallenge('vault-1', 'device-1'),
    ).rejects.toThrow('Invalid WebAuthn challenge');
  });
});
