import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
import { Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import {
  DUAL_ROOT_ROTATION_REPOSITORY,
  type DualRootRotationRepository,
} from '@vault-protocol/domain/ports/dual-root-rotation';
import type { VaultRotationTranscript } from '@vault-protocol/domain/value-objects/vault-rotation-transcript';
import type { PrepareDualRootRotationCommand } from '@vault-protocol/application/commands/prepare-dual-root-rotation/types';

@Injectable()
export class PrepareDualRootRotationHandler {
  constructor(
    @Inject(DUAL_ROOT_ROTATION_REPOSITORY)
    private readonly repository: DualRootRotationRepository,
  ) {}

  async execute(
    command: PrepareDualRootRotationCommand,
  ): Promise<VaultRotationTranscript> {
    assertFreshInteractiveAuth(command.user);
    return this.repository.prepare(
      {
        userId: command.user.userId,
        workspaceId: command.user.workspaceId,
        vaultId: command.vaultId,
        deviceId: command.deviceId,
        currentKeyId: command.currentKeyId,
        nextKeyId: command.nextKeyId,
        nextRecoveryPublicKey: command.nextRecoveryPublicKey,
        signingPublicKey: command.signingPublicKey,
        envelopePurpose: command.envelopePurpose,
        envelope: command.envelope,
        ...(command.passkeyEnvelope === undefined
          ? {}
          : { passkeyEnvelope: command.passkeyEnvelope }),
      },
      getInteractiveAuthDeadline(command.user),
    );
  }
}
