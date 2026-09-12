import {
  CRYPTO_VERSION,
  IV_LENGTH,
} from '#shared/adapters/persistence/crypto/constants';
import type {
  EncryptedRecordEnvelope,
  PersistenceCollection,
} from '#shared/adapters/persistence/ports';
import { isArrayBuffer } from '#shared/lib/is-array-buffer';
import { isRecord } from '#shared/lib/is-record';

export const isEncryptedRecordEnvelope = (
  value: unknown,
  expectedCollection: PersistenceCollection,
): value is EncryptedRecordEnvelope => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    value.cryptoVersion === CRYPTO_VERSION &&
    value.collection === expectedCollection &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    isArrayBuffer(value.ciphertext) &&
    isArrayBuffer(value.iv) &&
    value.iv.byteLength === IV_LENGTH &&
    typeof value.updatedAt === 'number'
  );
};
