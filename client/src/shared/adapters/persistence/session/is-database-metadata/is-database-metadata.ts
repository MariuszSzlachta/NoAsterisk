import {
  SALT_LENGTH,
  SENTINEL_COLLECTION,
} from '#shared/adapters/persistence/crypto';
import { isEncryptedRecordEnvelope } from '#shared/adapters/persistence/crypto/is-encrypted-record-envelope';
import {
  DATABASE_METADATA_ID,
  PERSISTENCE_CRYPTO_VERSION,
  PERSISTENCE_SCHEMA_VERSION,
  type DatabaseMetadataRecord,
} from '#shared/adapters/persistence/ports';
import { isArrayBuffer } from '#shared/lib/is-array-buffer';
import { isRecord } from '#shared/lib/is-record';

export const isDatabaseMetadata = (
  value: unknown,
): value is DatabaseMetadataRecord => {
  if (!isRecord(value)) {
    return false;
  }

  const salt = value.salt;
  const sentinel = value.sentinel;
  if (
    !isArrayBuffer(salt) ||
    !isEncryptedRecordEnvelope(sentinel, SENTINEL_COLLECTION)
  ) {
    return false;
  }

  return (
    value.id === DATABASE_METADATA_ID &&
    salt.byteLength === SALT_LENGTH &&
    value.schemaVersion === PERSISTENCE_SCHEMA_VERSION &&
    value.cryptoVersion === PERSISTENCE_CRYPTO_VERSION &&
    (value.legacyMigration === 'pending' ||
      value.legacyMigration === 'complete') &&
    typeof value.updatedAt === 'number'
  );
};
