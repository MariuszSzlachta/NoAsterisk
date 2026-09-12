import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const hashEnrollmentMessage = async (
  message: Uint8Array<ArrayBuffer>,
): Promise<string> => {
  if (message.length > enrollmentTranscriptFormat.maxSigningBytes)
    throw new Error('Enrollment message exceeds limit');
  return bytesToHex(
    new Uint8Array(await crypto.subtle.digest('SHA-256', message)),
  );
};
