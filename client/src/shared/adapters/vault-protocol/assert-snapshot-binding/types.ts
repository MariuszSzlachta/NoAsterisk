export interface SnapshotTransportMetadata {
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly revision: number;
  readonly previousEnvelopeHash: string;
  readonly envelopeHash: string;
  readonly createdAt: string;
}
