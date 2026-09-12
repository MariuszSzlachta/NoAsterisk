import { describe, expect, it } from 'vitest';

import { verifyRecoveryRegistrationAuthority } from '#features/user-settings/api/verify-recovery-registration-authority';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { buildRecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/testing/build-intent';

describe('verifyRecoveryRegistrationAuthority', () => {
  it('accepts the local signing authority and rejects a foreign one', async () => {
    const local = await deviceSigningKey.generate();
    const foreign = await deviceSigningKey.generate();
    const intent = buildRecoveryRegistrationIntent({
      signingPublicKey: JSON.stringify(
        await deviceSigningKey.exportPublicJwk(local.publicKey),
      ),
    });
    await expect(
      verifyRecoveryRegistrationAuthority(intent, local.publicKey, () => {}),
    ).resolves.toBeUndefined();
    await expect(
      verifyRecoveryRegistrationAuthority(intent, foreign.publicKey, () => {}),
    ).rejects.toThrow('signing authority mismatch');
  });
  it('rejects an expired intent even when the signing key matches', async () => {
    const local = await deviceSigningKey.generate();
    const intent = buildRecoveryRegistrationIntent({
      signingPublicKey: JSON.stringify(
        await deviceSigningKey.exportPublicJwk(local.publicKey),
      ),
      expiresAt: new Date(Date.now() - 1).toISOString(),
    });
    await expect(
      verifyRecoveryRegistrationAuthority(intent, local.publicKey, () => {}),
    ).rejects.toThrow('signing authority mismatch');
  });
});
