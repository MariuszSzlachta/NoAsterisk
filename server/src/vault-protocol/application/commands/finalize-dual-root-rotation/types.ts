import type { CurrentUserPayload } from '@shared/auth/current-user';
import type { VaultRotationTranscriptSnapshot } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

export interface FinalizeDualRootRotationCommand {
  readonly user: CurrentUserPayload;
  readonly transcript: VaultRotationTranscriptSnapshot;
  readonly deviceSignature: string;
  readonly recoverySignature: string;
}
