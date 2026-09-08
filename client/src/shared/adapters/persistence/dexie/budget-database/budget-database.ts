import Dexie, { type Table } from 'dexie';

import { ENCRYPTED_DATABASE_NAME } from '#shared/adapters/persistence/dexie/database-name';
import { PERSISTENCE_SCHEMA_VERSION } from '#shared/adapters/persistence/ports';
import type {
  DatabaseMetadataRecord,
  EncryptedRecordEnvelope,
} from '#shared/adapters/persistence/ports';

const DATABASE_SCHEMA = {
  records: '[collection+id], collection, updatedAt',
  metadata: 'id',
};

export class BudgetDatabase extends Dexie {
  public declare readonly records: Table<EncryptedRecordEnvelope, [string, string]>;
  public declare readonly metadata: Table<DatabaseMetadataRecord, string>;

  public constructor(name: string = ENCRYPTED_DATABASE_NAME) {
    super(name);
    this.version(PERSISTENCE_SCHEMA_VERSION).stores(DATABASE_SCHEMA);
  }
}
