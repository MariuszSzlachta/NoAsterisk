import { DomainError } from '@budget/domain';
import { UnauthorizedException } from '@nestjs/common';
import { ConfirmRecoveryRegistrationHandler } from '@vault-protocol/application/commands/confirm-recovery-registration';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';
import { buildRecoveryRegistrationRepositoryDouble } from '@vault-protocol/testing/build-recovery-registration-repository-double';
import { buildVaultSignatureVerifierDouble } from '@vault-protocol/testing/build-vault-signature-verifier-double';
import { interactiveAuthMaxAgeMs } from '@shared/auth/interactive-auth-window';

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

describe('ConfirmRecoveryRegistrationHandler', () => {
  it('should register only after both proofs cover the server-owned transcript', async () => {
    const registration = new RecoveryAuthorityRegistration(
      buildRecoveryRegistration(),
    );
    const repository = buildRecoveryRegistrationRepositoryDouble(registration);
    const verifier = buildVaultSignatureVerifierDouble();
    const deviceProof = jest.spyOn(verifier, 'verifyDevice');
    const recoveryProof = jest.spyOn(verifier, 'verifyRecovery');
    const register = jest.spyOn(repository, 'register');
    const command = buildRecoveryRegistrationCommand();
    await new ConfirmRecoveryRegistrationHandler(repository, verifier).execute(
      command,
    );
    expect(deviceProof).toHaveBeenCalledWith(
      registration.snapshot.signingPublicKey,
      registration.toSigningBytes(),
      command.deviceSignature,
    );
    expect(recoveryProof).toHaveBeenCalledWith(
      registration.snapshot.recoveryPublicKey,
      registration.toSigningBytes(),
      command.recoverySignature,
    );
    expect(register).toHaveBeenCalledWith(
      registration,
      (command.user.authTime ?? 0) + interactiveAuthMaxAgeMs,
    );
  });

  it.each(['verifyDevice', 'verifyRecovery'])(
    'should not mutate authority when %s rejects its proof',
    async (operation) => {
      const repository = buildRecoveryRegistrationRepositoryDouble();
      const verifier = buildVaultSignatureVerifierDouble();
      if (operation === 'verifyDevice')
        jest.spyOn(verifier, 'verifyDevice').mockResolvedValue(false);
      else jest.spyOn(verifier, 'verifyRecovery').mockResolvedValue(false);
      const register = jest.spyOn(repository, 'register');
      await expect(
        new ConfirmRecoveryRegistrationHandler(repository, verifier).execute(
          buildRecoveryRegistrationCommand(),
        ),
      ).rejects.toThrow(DomainError);
      expect(register).not.toHaveBeenCalled();
    },
  );

  it('should reject a missing challenge or mismatched repository scope', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble();
    const verifier = buildVaultSignatureVerifierDouble();
    const find = jest
      .spyOn(repository, 'findPending')
      .mockResolvedValue(undefined);
    const register = jest.spyOn(repository, 'register');
    const handler = new ConfirmRecoveryRegistrationHandler(
      repository,
      verifier,
    );
    await expect(
      handler.execute(buildRecoveryRegistrationCommand()),
    ).rejects.toThrow(DomainError);
    find.mockResolvedValue(
      new RecoveryAuthorityRegistration(
        buildRecoveryRegistration({ workspaceId: 'different-workspace' }),
      ),
    );
    await expect(
      handler.execute(buildRecoveryRegistrationCommand()),
    ).rejects.toThrow(DomainError);
    expect(register).not.toHaveBeenCalled();
  });

  it('should reject stale account auth before loading any challenge', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble();
    const find = jest.spyOn(repository, 'findPending');
    const command = buildRecoveryRegistrationCommand();
    await expect(
      new ConfirmRecoveryRegistrationHandler(
        repository,
        buildVaultSignatureVerifierDouble(),
      ).execute({
        ...command,
        user: { ...command.user, authTime: Date.now() - 360_000 },
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(find).not.toHaveBeenCalled();
  });

  it('should recheck fresh auth after proof verification before committing', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble();
    const register = jest.spyOn(repository, 'register');
    const verifier = buildVaultSignatureVerifierDouble();
    const command = buildRecoveryRegistrationCommand();
    const now = Date.now();
    jest.spyOn(verifier, 'verifyRecovery').mockImplementation(async () => {
      jest.spyOn(Date, 'now').mockReturnValue(now + 360_000);
      return true;
    });
    await expect(
      new ConfirmRecoveryRegistrationHandler(repository, verifier).execute(
        command,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(register).not.toHaveBeenCalled();
  });

  it('should propagate an atomic revocation or expiration rejection rather than report success', async () => {
    const repository = buildRecoveryRegistrationRepositoryDouble();
    jest
      .spyOn(repository, 'register')
      .mockRejectedValue(
        new DomainError('Recovery authority registration is unavailable'),
      );
    await expect(
      new ConfirmRecoveryRegistrationHandler(
        repository,
        buildVaultSignatureVerifierDouble(),
      ).execute(buildRecoveryRegistrationCommand()),
    ).rejects.toThrow(DomainError);
  });
});
