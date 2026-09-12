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
