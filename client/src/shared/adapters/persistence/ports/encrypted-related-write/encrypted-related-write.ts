import type { PersistenceCollection } from '#shared/adapters/persistence/ports/persistence-types';

export interface EncryptedRelatedWrite<TRecord extends object> {
  readonly collection: Exclude<PersistenceCollection, 'sentinel'>;
  readonly records: ReadonlyArray<TRecord>;
  readonly getId: (record: TRecord) => string;
}
