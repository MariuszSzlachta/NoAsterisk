import { describe, expect, it } from 'vitest';

import { passkeyLogin } from '#features/auth/api/passkey-login';

describe('passkeyLogin', () => {
  it('fails closed when the browser has no WebAuthn credentials API', async () => {
    const original = navigator.credentials;
    Object.defineProperty(navigator, 'credentials', {
      value: undefined,
      configurable: true,
    });
    await expect(passkeyLogin.run('owner@example.com')).rejects.toThrow(
      'unavailable',
    );
    Object.defineProperty(navigator, 'credentials', {
      value: original,
      configurable: true,
    });
  });
});
