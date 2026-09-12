import type {
  VaultV2Database,
  VaultV2Metadata,
} from '#shared/adapters/persistence/dexie/vault-v2-database/vault-v2-database';

export interface RotationJournalDatabaseFixture {
  readonly database: VaultV2Database;
  readonly metadata: VaultV2Metadata;
}
