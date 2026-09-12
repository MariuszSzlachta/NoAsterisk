import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';

export const encodeEnrollmentBytes = (
  fields: readonly (string | number | null)[],
): Uint8Array<ArrayBuffer> => {
  const bytes = new TextEncoder().encode(JSON.stringify(fields));
  if (bytes.length > enrollmentTranscriptFormat.maxSigningBytes)
    throw new Error('Enrollment transcript exceeds limit');
  return bytes;
};
