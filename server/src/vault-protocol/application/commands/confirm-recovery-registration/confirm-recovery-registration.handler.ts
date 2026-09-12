import { DomainError } from '@budget/domain';
import { Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import { getInteractiveAuthDeadline } from '@shared/auth/get-interactive-auth-deadline';
import {
  RECOVERY_REGISTRATION_REPOSITORY,
  type RecoveryRegistrationRepositoryPort,
} from '@vault-protocol/domain/ports/recovery-registration';
import {
  VAULT_SIGNATURE_VERIFIER,
  type VaultSignatureVerifierPort,
} from '@vault-protocol/domain/ports/vault-signature-verifier';
import type { ConfirmRecoveryRegistrationCommand } from '@vault-protocol/application/commands/confirm-recovery-registration/types';

@Injectable()
export class ConfirmRecoveryRegistrationHandler {
  constructor(
    @Inject(RECOVERY_REGISTRATION_REPOSITORY)
    private readonly repository: RecoveryRegistrationRepositoryPort,
    @Inject(VAULT_SIGNATURE_VERIFIER)
    private readonly verifier: VaultSignatureVerifierPort,
  ) {}

  async execute(command: ConfirmRecoveryRegistrationCommand): Promise<void> {
    const authDeadline = getInteractiveAuthDeadline(command.user);
    const scope = {
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
    };
    const registration = await this.repository.findPending(
      scope,
      command.challenge,
    );
    if (registration === undefined)
      throw new DomainError('Recovery authority registration is unavailable');
    registration.assertScope(scope);
    const message = registration.toSigningBytes();
    const isDeviceProofValid = await this.verifier.verifyDevice(
      registration.snapshot.signingPublicKey,
      message,
      command.deviceSignature,
    );
    if (!isDeviceProofValid)
      throw new DomainError('Recovery authority registration is unavailable');
    const isRecoveryProofValid = await this.verifier.verifyRecovery(
      registration.snapshot.recoveryPublicKey,
      message,
      command.recoverySignature,
    );
    if (!isRecoveryProofValid)
      throw new DomainError('Recovery authority registration is unavailable');
    assertFreshInteractiveAuth(command.user);
    await this.repository.register(registration, authDeadline);
  }
}
