import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { recoveryRegistrationFormat } from '#shared/adapters/vault-protocol/recovery-registration/constants';
import { recoveryRegistrationSchema } from '#shared/adapters/vault-protocol/recovery-registration/schema';
import type { RecoveryRegistrationIntent } from '#shared/adapters/vault-protocol/recovery-registration/types';

export const encodeRecoveryRegistration = (
  intent: RecoveryRegistrationIntent,
): Uint8Array<ArrayBuffer> => {
  const valid = recoveryRegistrationSchema.safeParse(intent);
  if (!valid.success) throw new Error('Invalid recovery registration intent');
  const bytes = new TextEncoder().encode(
    JSON.stringify([
      recoveryRegistrationFormat.domain,
      recoveryRegistrationFormat.version,
      recoveryRegistrationFormat.suite,
      intent.accountId,
      intent.workspaceId,
      intent.vaultId,
      intent.keyId,
      intent.deviceId,
      intent.challenge,
      intent.expiresAt,
      intent.signingPublicKey,
      intent.recoveryPublicKey,
    ]),
  );
  if (bytes.length > enrollmentTranscriptFormat.maxSigningBytes)
    throw new Error('Recovery registration exceeds protocol limit');
  return bytes;
};
