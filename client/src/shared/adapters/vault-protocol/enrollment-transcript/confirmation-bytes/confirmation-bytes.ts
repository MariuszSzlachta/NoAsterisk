import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { encodeEnrollmentBytes } from '#shared/adapters/vault-protocol/enrollment-transcript/encode-bytes';
import { enrollmentHexPattern } from '#shared/adapters/vault-protocol/enrollment-transcript/hex.pattern';
import { enrollmentTranscriptSchema } from '#shared/adapters/vault-protocol/enrollment-transcript/schema';
import type { EnrollmentTranscriptSnapshot } from '#shared/adapters/vault-protocol/enrollment-transcript/types';

export const encodeEnrollmentConfirmation = (
  input: EnrollmentTranscriptSnapshot,
  digest: string,
): Uint8Array<ArrayBuffer> => {
  const parsed = enrollmentTranscriptSchema.safeParse(input);
  if (
    !parsed.success ||
    digest.length !== enrollmentTranscriptFormat.digestLength ||
    !enrollmentHexPattern.test(digest)
  )
    throw new Error('Invalid enrollment confirmation');
  const snapshot = parsed.data;
  return encodeEnrollmentBytes([
    enrollmentTranscriptFormat.confirmationDomain,
    enrollmentTranscriptFormat.version,
    enrollmentTranscriptFormat.suite,
    snapshot.accountId,
    snapshot.workspaceId,
    snapshot.vaultId,
    snapshot.keyId,
    snapshot.deviceId,
    snapshot.challenge,
    new Date(snapshot.expiresAt).toISOString(),
    digest,
  ]);
};
