import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { assertFreshInteractiveAuth } from '@shared/auth/auth-freshness';
import type { CurrentUserPayload } from '@shared/auth/current-user';
import { VAULT_ENROLLMENT_REPOSITORY } from '@vault-protocol/domain/ports/vault-enrollment.token';
import type {
  VaultEnrollmentRepository,
  VaultEnrollmentConfirmation,
  VaultEnrollmentRequest,
} from '@vault-protocol/domain/ports/vault-enrollment.repository';

interface PrepareCommand {
  readonly user: CurrentUserPayload;
  readonly deviceId: string;
  readonly vaultId?: string;
  readonly recoveryConfirmed: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isPublicSigningJwk = (value: unknown): boolean => {
  if (!isRecord(value)) return false;
  return (
    value.kty === 'EC' &&
    value.crv === 'P-256' &&
    typeof value.x === 'string' &&
    typeof value.y === 'string' &&
    !('d' in value)
  );
};

@Injectable()
export class VaultEnrollmentHandler {
  constructor(
    @Inject(VAULT_ENROLLMENT_REPOSITORY)
    private readonly repository: VaultEnrollmentRepository,
  ) {}

  async prepare(command: PrepareCommand) {
    assertFreshInteractiveAuth(command.user);
    if (!command.recoveryConfirmed)
      throw new ForbiddenException('Recovery confirmation required');
    if (command.deviceId.length === 0)
      throw new ForbiddenException('Device ID is required');
    const prepared = await this.repository.prepare(
      command.user.userId,
      command.user.workspaceId,
      command.deviceId,
      command.vaultId,
    );
    return {
      challenge: prepared.challenge,
      serverShare: Buffer.from(prepared.serverShare).toString('base64'),
      expiresAt: prepared.expiresAt,
    };
  }

  async finalize(
    user: CurrentUserPayload,
    request: VaultEnrollmentRequest,
  ): Promise<void> {
    assertFreshInteractiveAuth(user);
    if (
      user.userId !== request.userId ||
      user.workspaceId !== request.workspaceId
    )
      throw new ForbiddenException('Enrollment context mismatch');
    let publicKey: unknown;
    try {
      publicKey = JSON.parse(request.signingPublicKey);
    } catch {
      throw new ForbiddenException('Invalid device signing key');
    }
    if (!isPublicSigningJwk(publicKey))
      throw new ForbiddenException('Invalid device signing key');
    await this.repository.finalize(request);
  }

  async confirm(
    user: CurrentUserPayload,
    request: VaultEnrollmentConfirmation,
  ): Promise<void> {
    assertFreshInteractiveAuth(user);
    if (
      user.userId !== request.userId ||
      user.workspaceId !== request.workspaceId
    )
      throw new ForbiddenException('Enrollment context mismatch');
    await this.repository.confirm(request);
  }
}
