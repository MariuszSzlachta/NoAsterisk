export interface SyncSnapshot {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly revision: number;
  readonly previousEnvelopeHash: string;
  readonly envelopeHash: string;
  readonly header: string;
  readonly ciphertext: string;
  readonly signature: string;
  /** Public metadata used by another device to verify the snapshot signer. */
  readonly signingPublicKey: string;
  readonly createdAt: string;
}

export interface SyncSnapshotRepository {
  findLatest(
    userId: string,
    workspaceId: string,
    vaultId: string,
  ): Promise<SyncSnapshot | undefined>;
  saveIfCurrent(
    userId: string,
    workspaceId: string,
    snapshot: SyncSnapshot,
    expectedRevision: number,
  ): Promise<'saved' | 'conflict' | 'forbidden'>;
}
