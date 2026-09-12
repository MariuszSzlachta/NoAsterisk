import { DomainError } from '@budget/domain';
import { UnauthorizedException } from '@nestjs/common';
import { PrepareSignedEnrollmentHandler } from '@vault-protocol/application/commands/prepare-signed-enrollment';
import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';
import { buildSignedEnrollmentRepositoryDouble } from '@vault-protocol/testing/build-signed-enrollment-repository-double';

describe('PrepareSignedEnrollmentHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  const intent = {
    purpose: 'recovery',
    vaultId: 'vault',
    keyId: 'key',
    deviceId: 'device',
    signingPublicKey: '{}',
    recoveryPublicKey: 'a'.repeat(64),
  };
  it('should bind public input to authenticated account/workspace and the interactive-auth deadline', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    const prepare = jest.spyOn(repository, 'prepare');
    await new PrepareSignedEnrollmentHandler(repository).execute({
      user,
      recoveryConfirmed: true,
      intent: { ...intent, purpose: 'recovery' },
    });
    expect(prepare).toHaveBeenCalledWith(
      { ...intent, accountId: user.userId, workspaceId: user.workspaceId },
      (user.authTime ?? 0) + 300_000,
    );
  });
  it('should reject stale auth and a missing backup acknowledgement before invoking the port', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    const prepare = jest.spyOn(repository, 'prepare');
    const handler = new PrepareSignedEnrollmentHandler(repository);
    await expect(
      handler.execute({
        user: { ...user, authTime: Date.now() - 360_000 },
        recoveryConfirmed: true,
        intent: { ...intent, purpose: 'recovery' },
      }),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      handler.execute({
        user,
        recoveryConfirmed: false,
        intent: { ...intent, purpose: 'recovery' },
      }),
    ).rejects.toThrow(DomainError);
    expect(prepare).not.toHaveBeenCalled();
  });
  it('should reject an enrollment returned for a different workspace', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    jest.spyOn(repository, 'prepare').mockResolvedValue(
      new SignedEnrollment(
        {
          intent: {
            ...buildEnrollmentTranscript(),
            accountId: user.userId,
            workspaceId: 'other',
          },
          state: { kind: 'pending' },
        },
        new Uint8Array(32),
      ),
    );
    await expect(
      new PrepareSignedEnrollmentHandler(repository).execute({
        user,
        recoveryConfirmed: true,
        intent: { ...intent, purpose: 'recovery' },
      }),
    ).rejects.toThrow(DomainError);
  });
});
