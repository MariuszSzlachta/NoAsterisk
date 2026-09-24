import type { PersistenceCollection } from '#shared/adapters/persistence/ports';

export interface VaultRecordContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

export interface CreateVaultRecordEnvelopeInput<TRecord extends object> {
  readonly collection: PersistenceCollection;
  readonly record: TRecord;
  readonly getId: (value: TRecord) => string;
  readonly key: CryptoKey;
  readonly context: VaultRecordContext;
}
