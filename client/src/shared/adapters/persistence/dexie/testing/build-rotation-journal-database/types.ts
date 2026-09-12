import type { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';
import type { VaultV2Metadata } from '#shared/adapters/persistence/dexie/vault-v2-database/types';

export interface RotationJournalDatabaseFixture {
  readonly database: VaultV2Database;
  readonly metadata: VaultV2Metadata;
}
