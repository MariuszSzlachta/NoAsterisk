import { SENTINEL_COLLECTION, SENTINEL_ID, SENTINEL_VALUE } from '#shared/adapters/persistence/crypto/constants';
import { createPersistenceCryptoError } from '#shared/adapters/persistence/crypto/errors';
import { decryptRecord } from '#shared/adapters/persistence/crypto/decrypt-record';
import type { EncryptedRecordEnvelope } from '#shared/adapters/persistence/ports';

export const verifySentinel = async (
  sentinel: EncryptedRecordEnvelope,
  key: CryptoKey,
): Promise<void> => {
  if (sentinel.id !== SENTINEL_ID) {
    throw createPersistenceCryptoError('Vault verification failed');
  }

  const value = await decryptRecord(
    sentinel,
    SENTINEL_COLLECTION,
    key,
    (candidate): candidate is { readonly value: string } => {
      if (typeof candidate !== 'object' || candidate === null || Array.isArray(candidate)) {
        return false;
      }
      return 'value' in candidate && typeof candidate.value === 'string';
    },
  );

  if (value.value !== SENTINEL_VALUE) {
    throw createPersistenceCryptoError('Vault verification failed');
  }
};
