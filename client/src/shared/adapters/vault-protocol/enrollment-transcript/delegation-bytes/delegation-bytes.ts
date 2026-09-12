import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { encodeEnrollmentBytes } from '#shared/adapters/vault-protocol/enrollment-transcript/encode-bytes';
import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';
import type { EnrollmentTranscriptSnapshot } from '#shared/adapters/vault-protocol/enrollment-transcript/types';

export const encodeEnrollmentDelegation = (
  input: EnrollmentTranscriptSnapshot,
): Uint8Array<ArrayBuffer> => {
  const parsed = enrollmentTranscriptSchema.safeParse(input);
  if (!parsed.success || parsed.data.purpose !== 'trusted')
    throw new Error('Invalid enrollment delegation');
  const snapshot = parsed.data;
  return encodeEnrollmentBytes([
    enrollmentTranscriptFormat.delegationDomain,
    2,
    enrollmentTranscriptFormat.suite,
    snapshot.accountId,
    snapshot.workspaceId,
    snapshot.vaultId,
    snapshot.keyId,
    snapshot.deviceId,
    snapshot.challenge,
    new Date(snapshot.expiresAt).toISOString(),
    snapshot.oldDeviceId,
    snapshot.signingPublicKey,
    snapshot.newEphemeralPublicKey,
  ]);
};
