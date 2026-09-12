import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import {
  VAULT_SECURITY_REPOSITORY,
  type VaultSecurityRepository,
} from '@vault-protocol/domain/ports/vault-security.repository';

interface EnableHighSecurityCommand {
  readonly user: CurrentUserPayload;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly passkeyEnvelope: string;
  readonly recoveryConfirmed: boolean;
}

@Injectable()
export class EnableHighSecurityHandler {
  constructor(
    @Inject(VAULT_SECURITY_REPOSITORY)
    private readonly repository: VaultSecurityRepository,
  ) {}

  async execute(command: EnableHighSecurityCommand): Promise<void> {
    assertFreshInteractiveAuth(command.user);
    if (command.user.amr !== 'webauthn')
      throw new ForbiddenException('Passkey step-up required');
    if (!command.recoveryConfirmed)
      throw new ForbiddenException('Recovery confirmation required');
    if (command.passkeyEnvelope.length === 0)
      throw new ForbiddenException('Passkey envelope is required');
    await this.repository.enableHighSecurity({
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      passkeyEnvelope: command.passkeyEnvelope,
    });
  }

  async enablePasskeyUnlock(command: EnableHighSecurityCommand): Promise<void> {
    assertFreshInteractiveAuth(command.user);
    if (command.user.amr !== 'webauthn')
      throw new ForbiddenException('Passkey step-up required');
    if (!command.recoveryConfirmed)
      throw new ForbiddenException('Recovery confirmation required');
    if (command.passkeyEnvelope.length === 0)
      throw new ForbiddenException('Passkey envelope is required');
    await this.repository.enablePasskeyUnlock({
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      passkeyEnvelope: command.passkeyEnvelope,
    });
  }

  async disable(command: EnableHighSecurityCommand): Promise<void> {
    assertFreshInteractiveAuth(command.user);
    if (command.user.amr !== 'webauthn')
      throw new ForbiddenException('Passkey step-up required');
    if (!command.recoveryConfirmed)
      throw new ForbiddenException('Recovery confirmation required');
    if (command.passkeyEnvelope.length === 0)
      throw new ForbiddenException('Device envelope is required');
    await this.repository.disableHighSecurity({
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      passkeyEnvelope: command.passkeyEnvelope,
    });
  }
}
