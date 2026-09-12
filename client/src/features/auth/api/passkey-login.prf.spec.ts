import { afterEach, describe, expect, it, vi } from 'vitest';

const post = vi.hoisted(() => vi.fn());
const setAccountContext = vi.hoisted(() => vi.fn());
const setAccessToken = vi.hoisted(() => vi.fn());
const getDeviceId = vi.hoisted(() => vi.fn(() => 'device-1'));
const runPrf = vi.hoisted(() => vi.fn());
const createSalt = vi.hoisted(() => vi.fn().mockResolvedValue(new Uint8Array(32)));

vi.mock('#shared/api', () => ({ apiClient: { post } }));
vi.mock('#shared/api/auth-tokens', () => ({ authTokens: { setAccessToken } }));
vi.mock('#shared/api/vault-protocol/device-id', () => ({
  vaultDeviceId: { get: getDeviceId },
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: { setAccountContext },
}));
vi.mock('#shared/adapters/webauthn/passkey-prf', () => ({
  passkeyPrf: { run: runPrf },
}));
vi.mock('#shared/adapters/webauthn/passkey-prf-salt', () => ({
  createPasskeyPrfSalt: createSalt,
}));

import { passkeyLogin } from './passkey-login';
import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';

describe('passkeyLogin PRF handoff', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    passkeyUnlockHandoff.clear();
  });

  it('keeps the PRF key client-only and hands it to the same login unlock', async () => {
    const prfKey = {} as CryptoKey;
    const assertion = {
      id: 'credential-1',
      rawId: 'AA',
      type: 'public-key' as const,
      response: {
        clientDataJSON: 'AA',
        authenticatorData: 'AA',
        signature: 'AA',
      },
    };
    runPrf.mockResolvedValue({
      credentialId: 'credential-1',
      prfKey,
      assertion,
    });
    vi.stubGlobal('navigator', {
      credentials: { get: vi.fn() },
    });
    post
      .mockResolvedValueOnce({
        challenge: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        rpId: 'localhost',
        userVerification: 'required',
        vaultContext: {
          accountId: 'account-1',
          workspaceId: 'workspace-1',
          vaultId: 'vault-1',
          keyId: 'key-1',
          deviceId: 'device-1',
        },
      })
      .mockResolvedValueOnce({
        accessToken: 'access-token',
        user: {
          id: 'account-1',
          email: 'owner@example.com',
          role: 'Member',
          workspaceId: 'workspace-1',
        },
      });

    await expect(passkeyLogin.run('owner@example.com')).resolves.toMatchObject({
      accessToken: 'access-token',
    });
    expect(post).toHaveBeenNthCalledWith(
      1,
      '/auth/passkey/options',
      { email: 'owner@example.com', deviceId: 'device-1' },
      { skipAuth: true },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/auth/passkey/verify',
      expect.objectContaining({ assertion }),
      { skipAuth: true },
    );
    expect(JSON.stringify(post.mock.calls)).not.toContain('prfKey');
    const context = {
      accountId: 'account-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
    };
    expect(passkeyUnlockHandoff.consume(context)).toMatchObject({
      credentialId: 'credential-1',
      prfKey,
    });
    expect(passkeyUnlockHandoff.consume(context)).toBeUndefined();
  });

  it('rejects malformed allowCredentials before invoking the WebAuthn API', async () => {
    vi.stubGlobal('navigator', { credentials: { get: vi.fn() } });
    post.mockResolvedValueOnce({
      challenge: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      allowCredentials: [{ id: 'AA', type: 'not-public-key' }],
    });

    await expect(passkeyLogin.run('owner@example.com')).rejects.toThrow(
      'Invalid passkey options',
    );
  });

  it('rejects a challenge that is not exactly 32 bytes', async () => {
    vi.stubGlobal('navigator', { credentials: { get: vi.fn() } });
    post.mockResolvedValueOnce({ challenge: 'AA' });

    await expect(passkeyLogin.run('owner@example.com')).rejects.toThrow(
      'Invalid passkey challenge',
    );
  });

  it('rejects an oversized vault context before passkey ceremony', async () => {
    vi.stubGlobal('navigator', { credentials: { get: vi.fn() } });
    post.mockResolvedValueOnce({
      challenge: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      vaultContext: {
        accountId: 'a'.repeat(129),
        workspaceId: 'workspace-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceId: 'device-1',
      },
    });

    await expect(passkeyLogin.run('owner@example.com')).rejects.toThrow(
      'Invalid passkey options',
    );
  });
});
