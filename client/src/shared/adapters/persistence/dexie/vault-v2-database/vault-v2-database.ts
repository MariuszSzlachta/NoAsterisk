import Dexie, { type Table } from 'dexie';

import { DATABASE_SCHEMA } from '#shared/adapters/persistence/dexie/vault-v2-database/constants';
import type {
  VaultV2Metadata,
  VaultV2RecordEnvelope,
} from '#shared/adapters/persistence/dexie/vault-v2-database/types';

export class VaultV2Database extends Dexie {
  declare public readonly records: Table<
    VaultV2RecordEnvelope,
    [string, string]
  >;
  declare public readonly metadata: Table<VaultV2Metadata, string>;

  public constructor(accountId: string, workspaceId: string, vaultId: string) {
    super(`budgetflow-vault-v2:${accountId}:${workspaceId}:${vaultId}`);
    this.version(2).stores(DATABASE_SCHEMA);
  }
}
