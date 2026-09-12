import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { encodeEnrollmentBytes } from '#shared/adapters/vault-protocol/enrollment-transcript/encode-bytes';
import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';
import type { EnrollmentTranscriptSnapshot } from '#shared/adapters/vault-protocol/enrollment-transcript/types';

export const encodeEnrollmentFinalize = (
  input: EnrollmentTranscriptSnapshot,
): Uint8Array<ArrayBuffer> => {
  const parsed = enrollmentTranscriptSchema.safeParse(input);
  if (!parsed.success) throw new Error('Invalid enrollment transcript');
  const snapshot = parsed.data;
  return encodeEnrollmentBytes([
    enrollmentTranscriptFormat.finalizeDomain,
    2,
    enrollmentTranscriptFormat.suite,
    snapshot.purpose,
    snapshot.accountId,
    snapshot.workspaceId,
    snapshot.vaultId,
    snapshot.keyId,
    snapshot.deviceId,
    snapshot.challenge,
    new Date(snapshot.expiresAt).toISOString(),
    snapshot.signingPublicKey,
    snapshot.purpose === 'trusted' ? snapshot.oldDeviceId : null,
    snapshot.purpose === 'trusted' ? snapshot.newEphemeralPublicKey : null,
    snapshot.purpose === 'trusted'
      ? snapshot.delegationDigest
      : snapshot.recoveryPublicKey,
    snapshot.deviceEnvelope,
    snapshot.passkeyEnvelope ?? null,
  ]);
};
