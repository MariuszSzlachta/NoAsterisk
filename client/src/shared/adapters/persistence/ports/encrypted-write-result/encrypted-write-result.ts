export interface EncryptedWriteResult<TRecord extends object> {
  readonly written: ReadonlyArray<TRecord>;
  readonly duplicatesSkipped: number;
}
