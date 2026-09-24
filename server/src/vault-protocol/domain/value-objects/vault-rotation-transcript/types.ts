export type VaultRotationEnvelopePurpose = 'device-wrap' | 'passkey-wrap';

export interface VaultRotationTranscriptSnapshot {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly deviceId: string;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly challenge: string;
  readonly expiresAt: number;
  readonly currentRecoveryPublicKey: string;
  readonly nextRecoveryPublicKey: string;
  readonly signingPublicKey: string;
  readonly envelopePurpose: VaultRotationEnvelopePurpose;
  readonly envelope: string;
  readonly passkeyEnvelope?: string;
}
