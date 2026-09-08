import type { EncryptedWriteResult } from '#shared/adapters/persistence/ports/encrypted-write-result';

export interface EncryptedRepository<TRecord extends object> {
  readonly get: (id: string) => Promise<TRecord | undefined>;
  readonly getAll: () => Promise<ReadonlyArray<TRecord>>;
  readonly put: (record: TRecord) => Promise<void>;
  readonly putMany: (records: ReadonlyArray<TRecord>) => Promise<void>;
  readonly putManyIfAbsent: (
    records: ReadonlyArray<TRecord>,
    getDuplicateKey: (record: TRecord) => string,
  ) => Promise<EncryptedWriteResult<TRecord>>;
  readonly replace: (records: ReadonlyArray<TRecord>) => Promise<void>;
  readonly delete: (id: string) => Promise<void>;
  readonly clear: () => Promise<void>;
}
