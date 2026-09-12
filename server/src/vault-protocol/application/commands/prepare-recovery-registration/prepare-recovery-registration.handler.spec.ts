import { DomainError } from '@budget/domain';
import { UnauthorizedException } from '@nestjs/common';
import { PrepareRecoveryRegistrationHandler } from '@vault-protocol/application/commands/prepare-recovery-registration';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';
import { buildRecoveryRegistrationRepositoryDouble } from '@vault-protocol/testing/build-recovery-registration-repository-double';

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('PrepareRecoveryRegistrationHandler', () => {
  it('should derive account ownership from fresh authenticated context', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble();
    const prepare = jest.spyOn(repository, 'prepare');
    const command = buildRecoveryRegistrationCommand();
    const recoveryPublicKey = buildRecoveryRegistration().recoveryPublicKey;
    await new PrepareRecoveryRegistrationHandler(repository).execute({
      ...command,
      recoveryPublicKey,
    });
    expect(prepare).toHaveBeenCalledWith({
      userId: command.user.userId,
      workspaceId: command.user.workspaceId,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      recoveryPublicKey,
    });
  });

  it('should reject stale auth before issuing a challenge', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble();
    const prepare = jest.spyOn(repository, 'prepare');
    const command = buildRecoveryRegistrationCommand();
    await expect(
      new PrepareRecoveryRegistrationHandler(repository).execute({
        ...command,
        recoveryPublicKey: buildRecoveryRegistration().recoveryPublicKey,
        user: { ...command.user, authTime: Date.now() - 360_000 },
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(prepare).not.toHaveBeenCalled();
  });

  it('should reject a preparation returned for a different workspace', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble(
      new RecoveryAuthorityRegistration(
        buildRecoveryRegistration({ workspaceId: 'other-workspace' }),
      ),
    );
    await expect(
      new PrepareRecoveryRegistrationHandler(repository).execute({
        ...buildRecoveryRegistrationCommand(),
        recoveryPublicKey: buildRecoveryRegistration().recoveryPublicKey,
      }),
    ).rejects.toThrow(DomainError);
  });
});
