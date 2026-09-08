import type { PersistenceCollection } from '#shared/adapters/persistence/ports/persistence-types';

export interface EncryptedRecordDeletion {
  readonly collection: Exclude<PersistenceCollection, 'sentinel'>;
  readonly validator: (value: unknown) => value is object;
  readonly shouldDelete: (record: object) => boolean;
}
