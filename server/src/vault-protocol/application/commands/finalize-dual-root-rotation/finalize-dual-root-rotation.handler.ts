import { Inject, Injectable } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
import {
  DUAL_ROOT_ROTATION_REPOSITORY,
  type DualRootRotationRepository,
} from '@vault-protocol/domain/ports/dual-root-rotation';
import { verifyVaultRotationProof } from '@vault-protocol/domain/value-objects/vault-rotation-proof';
import {
  VAULT_SIGNATURE_VERIFIER,
  type VaultSignatureVerifierPort,
} from '@vault-protocol/domain/ports/vault-signature-verifier';
import type { FinalizeDualRootRotationCommand } from '@vault-protocol/application/commands/finalize-dual-root-rotation/types';
import { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';

@Injectable()
export class FinalizeDualRootRotationHandler {
  constructor(
    @Inject(DUAL_ROOT_ROTATION_REPOSITORY)
    private readonly repository: DualRootRotationRepository,
    @Inject(VAULT_SIGNATURE_VERIFIER)
    private readonly verifier: VaultSignatureVerifierPort,
  ) {}

  async execute(command: FinalizeDualRootRotationCommand): Promise<void> {
    assertFreshInteractiveAuth(command.user);
    if (
      command.transcript.accountId !== command.user.userId ||
      command.transcript.workspaceId !== command.user.workspaceId
    )
      throw new DomainError('Dual-root vault rotation is unavailable');
    const transcript = new VaultRotationTranscript(command.transcript);
    await verifyVaultRotationProof(
      transcript,
      {
        deviceSignature: command.deviceSignature,
        recoverySignature: command.recoverySignature,
      },
      this.verifier,
    );
    assertFreshInteractiveAuth(command.user);
    await this.repository.finalize(
      transcript,
      {
        deviceSignature: command.deviceSignature,
        recoverySignature: command.recoverySignature,
      },
      getInteractiveAuthDeadline(command.user),
    );
  }
}
