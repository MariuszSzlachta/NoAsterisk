import { CRYPTO_VERSION } from '#shared/adapters/persistence/crypto/constants';

const PERSISTENCE_SCHEMA_VERSION = 1;
const PERSISTENCE_CRYPTO_VERSION = CRYPTO_VERSION;
const DATABASE_METADATA_ID = 'vault';

type PersistenceCollection =
  | 'transactions'
  | 'rules'
  | 'categories'
  | 'budgets'
  | 'period-history'
  | 'import-profiles'
  | 'sentinel';

interface EncryptedRecordEnvelope {
  readonly id: string;
  readonly collection: PersistenceCollection;
  readonly ciphertext: ArrayBuffer;
  readonly iv: ArrayBuffer;
  readonly cryptoVersion: typeof PERSISTENCE_CRYPTO_VERSION;
  readonly updatedAt: number;
}

interface DatabaseMetadataRecord {
  readonly id: typeof DATABASE_METADATA_ID;
  readonly salt: ArrayBuffer;
  readonly schemaVersion: typeof PERSISTENCE_SCHEMA_VERSION;
  readonly cryptoVersion: typeof PERSISTENCE_CRYPTO_VERSION;
  readonly sentinel: EncryptedRecordEnvelope;
  readonly legacyMigration: 'pending' | 'complete';
  readonly updatedAt: number;
}

interface EncryptedCollectionWrite {
  readonly collection: PersistenceCollection;
  readonly records: ReadonlyArray<object>;
}

/** Reserved for the future import-profile feature; no such store exists yet. */
interface ImportProfileRecord {
  readonly id: string;
  readonly name: string;
  readonly columnMapping: Readonly<Record<string, string>>;
  readonly createdAt: string;
}

export {
  PERSISTENCE_CRYPTO_VERSION,
  PERSISTENCE_SCHEMA_VERSION,
  DATABASE_METADATA_ID,
  type DatabaseMetadataRecord,
  type EncryptedCollectionWrite,
  type EncryptedRecordEnvelope,
  type ImportProfileRecord,
  type PersistenceCollection,
};
