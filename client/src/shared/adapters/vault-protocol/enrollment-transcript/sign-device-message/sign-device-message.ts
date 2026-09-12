import { enrollmentTranscriptFormat } from '#shared/adapters/vault-protocol/enrollment-transcript/constants';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const signEnrollmentDeviceMessage = async (
  key: CryptoKey,
  message: Uint8Array<ArrayBuffer>,
): Promise<string> => {
  if (message.length > enrollmentTranscriptFormat.maxSigningBytes)
    throw new Error('Enrollment message exceeds limit');
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, message),
  );
  if (signature.length !== enrollmentTranscriptFormat.signatureBytes)
    throw new Error('Invalid enrollment signature');
  return bytesToHex(signature);
};
