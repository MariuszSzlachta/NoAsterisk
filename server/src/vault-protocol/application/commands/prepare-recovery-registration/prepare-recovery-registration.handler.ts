import { Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import {
  RECOVERY_REGISTRATION_REPOSITORY,
  type RecoveryRegistrationRepositoryPort,
} from '@vault-protocol/domain/ports/recovery-registration';
import type { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import type { PrepareRecoveryRegistrationCommand } from '@vault-protocol/application/commands/prepare-recovery-registration/types';

@Injectable()
export class PrepareRecoveryRegistrationHandler {
  constructor(
    @Inject(RECOVERY_REGISTRATION_REPOSITORY)
    private readonly repository: RecoveryRegistrationRepositoryPort,
  ) {}

  async execute(
    command: PrepareRecoveryRegistrationCommand,
  ): Promise<RecoveryAuthorityRegistration> {
    // ARCH-EXCEPTION: repository/domain scope assertion owns workspace authorization — accepted permanently.
    assertFreshInteractiveAuth(command.user);
    const request = {
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      recoveryPublicKey: command.recoveryPublicKey,
    };
    const registration = await this.repository.prepare(request);
    registration.assertScope(request);
    return registration;
  }
}
