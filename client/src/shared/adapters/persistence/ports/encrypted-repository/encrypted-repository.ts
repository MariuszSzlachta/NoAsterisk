export interface EncryptedRepository<TRecord extends object> {
  readonly get: (id: string) => Promise<TRecord | undefined>;
  readonly getAll: () => Promise<ReadonlyArray<TRecord>>;
  readonly put: (record: TRecord) => Promise<void>;
  readonly putMany: (records: ReadonlyArray<TRecord>) => Promise<void>;
  readonly replace: (records: ReadonlyArray<TRecord>) => Promise<void>;
  readonly delete: (id: string) => Promise<void>;
  readonly clear: () => Promise<void>;
}
