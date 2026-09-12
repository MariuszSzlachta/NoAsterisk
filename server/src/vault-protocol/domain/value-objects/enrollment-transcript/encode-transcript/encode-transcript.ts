import { DomainError } from '@budget/domain';
import { enrollmentTranscriptFormat } from '@vault-protocol/domain/value-objects/enrollment-transcript/constants';

export const encodeEnrollmentTranscript = (
  fields: readonly (string | number | null)[],
): Uint8Array<ArrayBuffer> => {
  const bytes = new TextEncoder().encode(JSON.stringify(fields));
  if (bytes.length > enrollmentTranscriptFormat.maxSigningBytes)
    throw new DomainError('Enrollment authorization transcript exceeds limit');
  return bytes;
};
