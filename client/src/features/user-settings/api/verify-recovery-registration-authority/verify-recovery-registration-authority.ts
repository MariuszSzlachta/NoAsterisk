import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import type { RecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/types';

export const verifyRecoveryRegistrationAuthority = async (
  intent: RecoveryRegistrationIntent,
  signingPublicKey: CryptoKey,
  assertCurrent: () => void,
): Promise<void> => {
  const expected = JSON.stringify(
    await deviceSigningKey.exportPublicJwk(signingPublicKey),
  );
  assertCurrent();
  const imported = await deviceSigningKey.importPublicJwk(
    JSON.parse(intent.signingPublicKey),
  );
  assertCurrent();
  const actual = JSON.stringify(
    await deviceSigningKey.exportPublicJwk(imported),
  );
  assertCurrent();
  if (expected !== actual || Date.parse(intent.expiresAt) <= Date.now())
    throw new Error('Recovery registration signing authority mismatch');
};
