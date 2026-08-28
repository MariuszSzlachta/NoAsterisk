export interface VaultPayload {
  readonly transactions: ReadonlyArray<Record<string, unknown>>;
  readonly rules: ReadonlyArray<Record<string, unknown>>;
}
