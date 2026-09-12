import {
  createSentinel,
  derivePersistenceKey,
  SALT_LENGTH,
  verifySentinel,
} from '#shared/adapters/persistence/crypto';
import { createPersistenceCryptoError } from '#shared/adapters/persistence/crypto/errors';
import type { BudgetDatabase } from '#shared/adapters/persistence/dexie';
import {
  DATABASE_METADATA_ID,
  PERSISTENCE_CRYPTO_VERSION,
  PERSISTENCE_SCHEMA_VERSION,
  type DatabaseMetadataRecord,
} from '#shared/adapters/persistence/ports';
import { isDatabaseMetadata } from '#shared/adapters/persistence/session/is-database-metadata';

export const initializePersistenceMetadata = async (
  database: BudgetDatabase,
  passphrase: string,
): Promise<{
  readonly metadata: DatabaseMetadataRecord;
  readonly key: CryptoKey;
}> => {
  const storedMetadata = await database.metadata.get(DATABASE_METADATA_ID);

  if (storedMetadata !== undefined) {
    if (!isDatabaseMetadata(storedMetadata)) {
      throw createPersistenceCryptoError('Invalid encrypted database metadata');
    }

    const key = await derivePersistenceKey(passphrase, storedMetadata.salt);
    await verifySentinel(storedMetadata.sentinel, key);
    return { metadata: storedMetadata, key };
  }

  const salt = crypto
    .getRandomValues(new Uint8Array(SALT_LENGTH))
    .slice().buffer;
  const key = await derivePersistenceKey(passphrase, salt);
  const metadata: DatabaseMetadataRecord = {
    id: DATABASE_METADATA_ID,
    salt,
    schemaVersion: PERSISTENCE_SCHEMA_VERSION,
    cryptoVersion: PERSISTENCE_CRYPTO_VERSION,
    sentinel: await createSentinel(key),
    legacyMigration: 'pending',
    updatedAt: Date.now(),
  };
  await database.metadata.put(metadata);
  return { metadata, key };
};
