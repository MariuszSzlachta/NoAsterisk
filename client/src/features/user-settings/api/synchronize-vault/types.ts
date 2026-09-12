export interface RemoteVaultSnapshot {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly revision: number;
  readonly previousEnvelopeHash: string;
  readonly envelopeHash: string;
  readonly header: string;
  readonly ciphertext: string;
  readonly signature: string;
  readonly signingPublicKey: string;
  readonly createdAt: string;
}

export type VaultSyncResult =
  | { readonly status: 'saved'; readonly snapshot: RemoteVaultSnapshot }
  | { readonly status: 'noop'; readonly snapshot?: RemoteVaultSnapshot }
  | { readonly status: 'conflict'; readonly snapshot?: RemoteVaultSnapshot };
export interface VaultSyncHighWater {
  readonly observedRevision: number | undefined;
  readonly highWaterEnvelopeHash?: string;
}

export interface VaultSyncOptions {
  readonly force?: boolean;
}
