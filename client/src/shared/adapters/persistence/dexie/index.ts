export { BudgetDatabase } from '#shared/adapters/persistence/dexie/budget-database';
export { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';
export { createVaultV2Repository } from '#shared/adapters/persistence/dexie/vault-v2-repository';
export { rotateVaultRecords } from '#shared/adapters/persistence/dexie/vault-v2-repository';
export type { VaultV2RotationJournal } from '#shared/adapters/persistence/dexie/vault-v2-database';
export {
  ENCRYPTED_DATABASE_NAME,
  getAccountDatabaseName,
} from '#shared/adapters/persistence/dexie/database-name';
export { encryptedDatabase } from '#shared/adapters/persistence/dexie/encrypted-database-instance';
export { createEncryptedDexieRepository } from '#shared/adapters/persistence/dexie/encrypted-dexie-repository';
export { deleteMatchingRecords } from '#shared/adapters/persistence/dexie/delete-matching-records';
export { putManyIfAbsentWithRelated } from '#shared/adapters/persistence/dexie/put-many-if-absent-with-related';
