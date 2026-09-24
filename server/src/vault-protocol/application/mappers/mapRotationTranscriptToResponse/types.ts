export interface RotationTranscriptResponse {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly deviceId: string;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly challenge: string;
  readonly expiresAt: string;
  readonly currentRecoveryPublicKey: string;
  readonly nextRecoveryPublicKey: string;
  readonly signingPublicKey: string;
  readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
  readonly envelope: string;
  readonly passkeyEnvelope?: string;
}
