import { DomainError } from '@budget/domain';
import { Injectable } from '@nestjs/common';
import type {
  DualRootRotationRepository,
  PrepareDualRootRotationRequest,
} from '@vault-protocol/domain/ports/dual-root-rotation';
import type { VaultRotationProof } from '@vault-protocol/domain/value-objects/vault-rotation-proof';
import type { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

/** Fail closed until the memory authority graph supports the complete rotation transaction. */
@Injectable()
export class UnavailableMemoryDualRootRotationRepository implements DualRootRotationRepository {
  async prepare(_request: PrepareDualRootRotationRequest): Promise<never> {
    throw new DomainError('Dual-root vault rotation is unavailable');
  }

  async finalize(
    _transcript: VaultRotationTranscript,
    _proof: VaultRotationProof,
    _authDeadline: number,
  ): Promise<never> {
    throw new DomainError('Dual-root vault rotation is unavailable');
  }
}
