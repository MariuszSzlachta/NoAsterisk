import { afterEach, describe, expect, it, vi } from 'vitest';

import { passkeyPrf } from '#shared/adapters/webauthn/passkey-prf';

vi.mock('#shared/adapters/vault-protocol/vault-protocol', () => ({
  vaultProtocol: { importPrfOutput: vi.fn().mockResolvedValue({}) },
}));

describe('passkeyPrf', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fails closed when the browser does not expose credentials', async () => {
    const original = navigator.credentials;
    Object.defineProperty(navigator, 'credentials', { value: undefined, configurable: true });
    await expect(
      passkeyPrf.run({ challenge: new Uint8Array(32), salt: new Uint8Array(32) }),
    ).rejects.toThrow('unavailable');
    Object.defineProperty(navigator, 'credentials', { value: original, configurable: true });
  });

  it('returns a client-only PRF key and an allowlisted assertion DTO', async () => {
    class FakeAssertionResponse {
      readonly clientDataJSON = new ArrayBuffer(1);
      readonly authenticatorData = new ArrayBuffer(1);
      readonly signature = new ArrayBuffer(1);
      readonly userHandle = null;
    }
    class FakePublicKeyCredential {
      readonly id = 'credential-1';
      readonly rawId = new ArrayBuffer(1);
      readonly response = new FakeAssertionResponse();
      getClientExtensionResults() {
        return { prf: { results: { first: new ArrayBuffer(32) } } };
      }
    }
    vi.stubGlobal('PublicKeyCredential', FakePublicKeyCredential);
    vi.stubGlobal('AuthenticatorAssertionResponse', FakeAssertionResponse);
    const get = vi.fn().mockResolvedValue(new FakePublicKeyCredential());
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get },
    });

    const result = await passkeyPrf.run({
      challenge: new Uint8Array(32),
      salt: new Uint8Array(32),
    });

    expect(result.credentialId).toBe('credential-1');
    expect(result.assertion).toEqual({
      id: 'credential-1',
      rawId: 'AA',
      type: 'public-key',
      response: {
        clientDataJSON: 'AA',
        authenticatorData: 'AA',
        signature: 'AA',
      },
    });
    expect(result.assertion).not.toHaveProperty('clientExtensionResults');
    expect(get).toHaveBeenCalledOnce();
  });

  it('returns the same allowlisted assertion without a PRF key when fallback is allowed', async () => {
    class FakeAssertionResponse {
      readonly clientDataJSON = new ArrayBuffer(1);
      readonly authenticatorData = new ArrayBuffer(1);
      readonly signature = new ArrayBuffer(1);
      readonly userHandle = null;
    }
    class FakePublicKeyCredential {
      readonly id = 'credential-without-prf';
      readonly rawId = new ArrayBuffer(1);
      readonly response = new FakeAssertionResponse();
      getClientExtensionResults() {
        return {};
      }
    }
    vi.stubGlobal('PublicKeyCredential', FakePublicKeyCredential);
    vi.stubGlobal('AuthenticatorAssertionResponse', FakeAssertionResponse);
    Object.defineProperty(navigator, 'credentials', {
      configurable: true,
      value: { get: vi.fn().mockResolvedValue(new FakePublicKeyCredential()) },
    });

    await expect(
      passkeyPrf.run({
        challenge: new Uint8Array(32),
        salt: new Uint8Array(32),
        requirePrf: false,
      }),
    ).resolves.toMatchObject({
      credentialId: 'credential-without-prf',
      prfKey: undefined,
      assertion: { id: 'credential-without-prf' },
    });
  });
});
