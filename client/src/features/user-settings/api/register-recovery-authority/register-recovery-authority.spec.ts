import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerRecoveryAuthority } from '#features/user-settings/api/register-recovery-authority';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';
import { apiClient } from '#shared/api';

afterEach(() => vi.restoreAllMocks());
describe('registerRecoveryAuthority', () => {
  it('does not send a request for an already cancelled operation', async () => {
    const keys = await deviceSigningKey.generate();
    const post = vi.spyOn(apiClient, 'post');
    await expect(
      registerRecoveryAuthority({
        context: buildRecoveryRegistrationIntent(),
        recoverySeed: new Uint8Array(32),
        signingKey: keys.privateKey,
        signingPublicKey: keys.publicKey,
        assertCurrent: () => {
          throw new Error('Cancelled');
        },
      }),
    ).rejects.toThrow('Cancelled');
    expect(post).not.toHaveBeenCalled();
  });
});
