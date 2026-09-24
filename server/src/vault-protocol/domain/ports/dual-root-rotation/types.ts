import type { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { VaultRotationProof } from '@vault-protocol/domain/value-objects/vault-rotation-proof';

export interface PrepareDualRootRotationRequest {
  readonly userId: string;
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

export interface DualRootRotationRepository {
  prepare(
    request: PrepareDualRootRotationRequest,
    authDeadline: number,
  ): Promise<VaultRotationTranscript>;
  finalize(
    transcript: VaultRotationTranscript,
    proof: VaultRotationProof,
    authDeadline: number,
  ): Promise<void>;
}
