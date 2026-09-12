import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import {
  VAULT_ROTATION_REPOSITORY,
  type RotateVaultRequest,
  type RotateVaultResult,
  type VaultEnvelopePurpose,
  type VaultRotationRepository,
} from '@vault-protocol/domain/ports/vault-rotation.repository';

interface RotateVaultCommand {
  readonly user: CurrentUserPayload;
  readonly vaultId: string;
  readonly deviceId: string;
  readonly currentKeyId: string;
  readonly nextKeyId: string;
  readonly envelopePurpose: VaultEnvelopePurpose;
  readonly envelope: string;
  readonly passkeyEnvelope?: string;
  readonly recoveryConfirmed: boolean;
  readonly idempotencyKey: string;
}

const isIdentifier = (value: string): boolean =>
  value.length > 0 && value.length <= 128;

@Injectable()
export class RotateVaultHandler {
  constructor(
    @Inject(VAULT_ROTATION_REPOSITORY)
    private readonly repository: VaultRotationRepository,
  ) {}

  async execute(command: RotateVaultCommand): Promise<RotateVaultResult> {
    assertFreshInteractiveAuth(command.user);
    if (!command.recoveryConfirmed)
      throw new ForbiddenException('Recovery confirmation required');
    if (
      !isIdentifier(command.vaultId) ||
      !isIdentifier(command.deviceId) ||
      !isIdentifier(command.currentKeyId) ||
      !isIdentifier(command.nextKeyId) ||
      !isIdentifier(command.idempotencyKey)
    )
      throw new ForbiddenException('Invalid vault rotation request');
    if (command.currentKeyId === command.nextKeyId)
      throw new ForbiddenException('Vault key must change during rotation');
    if (command.envelope.length === 0 || command.envelope.length > 128 * 1024)
      throw new ForbiddenException('Invalid vault envelope');
    if (
      command.passkeyEnvelope !== undefined &&
      (command.envelopePurpose !== 'device-wrap' ||
        command.passkeyEnvelope.length === 0 ||
        command.passkeyEnvelope.length > 128 * 1024)
    )
      throw new ForbiddenException('Invalid passkey vault envelope');
    const request: RotateVaultRequest = {
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      deviceId: command.deviceId,
      currentKeyId: command.currentKeyId,
      nextKeyId: command.nextKeyId,
      envelopePurpose: command.envelopePurpose,
      envelope: command.envelope,
      ...(command.passkeyEnvelope === undefined
        ? {}
        : { passkeyEnvelope: command.passkeyEnvelope }),
      protocolVersion: '2',
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      idempotencyKey: command.idempotencyKey,
    };
    return this.repository.rotate(request);
  }
}
