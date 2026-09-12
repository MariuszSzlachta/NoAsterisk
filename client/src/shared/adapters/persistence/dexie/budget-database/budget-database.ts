import Dexie, { type Table } from 'dexie';

import { ENCRYPTED_DATABASE_NAME } from '#shared/adapters/persistence/dexie/database-name';
import {
  PERSISTENCE_SCHEMA_VERSION,
  type DatabaseMetadataRecord,
  type EncryptedRecordEnvelope,
} from '#shared/adapters/persistence/ports';

const DATABASE_SCHEMA = {
  records: '[collection+id], collection, updatedAt',
  metadata: 'id',
};

export class BudgetDatabase extends Dexie {
  declare public readonly records: Table<
    EncryptedRecordEnvelope,
    [string, string]
  >;
  declare public readonly metadata: Table<DatabaseMetadataRecord, string>;

  public constructor(name: string = ENCRYPTED_DATABASE_NAME) {
    super(name);
    this.version(PERSISTENCE_SCHEMA_VERSION).stores(DATABASE_SCHEMA);
  }
}
