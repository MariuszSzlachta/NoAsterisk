import type { PersistenceCollection } from '#shared/adapters/persistence/ports/persistence-types';

export interface EncryptedCollectionWriteIfAbsent<TRecord extends object> {
  readonly collection: Exclude<PersistenceCollection, 'sentinel'>;
  readonly records: ReadonlyArray<TRecord>;
  readonly validator: (value: unknown) => value is TRecord;
  readonly getId: (record: TRecord) => string;
  readonly getDuplicateKey: (record: TRecord) => string;
}
