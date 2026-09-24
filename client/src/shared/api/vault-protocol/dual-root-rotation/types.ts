import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';

export interface PrepareDualRootRotationInput {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly deviceId: string;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly nextRecoveryPublicKey: string;
  readonly signingPublicKey: string;
  readonly envelopePurpose: 'device-wrap' | 'passkey-wrap';
  readonly envelope: string;
  readonly passkeyEnvelope?: string;
}

export interface FinalizeDualRootRotationInput {
  readonly transcript: RotationTranscriptSnapshot;
  readonly deviceSignature: string;
  readonly recoverySignature: string;
}
