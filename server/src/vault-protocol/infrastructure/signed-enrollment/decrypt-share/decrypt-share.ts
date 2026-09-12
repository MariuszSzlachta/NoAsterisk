import { DomainError } from '@budget/domain';
import { ServerShareEncryptionAdapter } from '@vault-protocol/infrastructure/server-share-encryption.adapter';
import { encryptedEnrollmentShareSchema } from '@vault-protocol/infrastructure/signed-enrollment/encrypted-share-schema';

export const decryptSignedEnrollmentShare = (
  serialized: string,
): Uint8Array => {
  try {
    const raw: unknown = JSON.parse(serialized);
    const encrypted = encryptedEnrollmentShareSchema.safeParse(raw);
    if (!encrypted.success) throw new DomainError('Enrollment unavailable');
    return new ServerShareEncryptionAdapter().decrypt(encrypted.data);
  } catch {
    throw new DomainError('Enrollment unavailable');
  }
};
