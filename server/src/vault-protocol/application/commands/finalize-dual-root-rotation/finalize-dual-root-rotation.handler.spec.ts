import { DomainError } from '@budget/domain';
import { UnauthorizedException } from '@nestjs/common';
import { FinalizeDualRootRotationHandler } from '@vault-protocol/application/commands/finalize-dual-root-rotation';
import { buildDualRootRotationRepositoryDouble } from '@vault-protocol/testing/buildDualRootRotationRepositoryDouble';
import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';
import { signVaultRotation } from '@vault-protocol/testing/signVaultRotation';
import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';

afterEach(() => jest.clearAllMocks());
afterAll(() => jest.restoreAllMocks());
describe('FinalizeDualRootRotationHandler', () => {
  it('should finalize a matching transcript after both native signatures are verified', async () => {
    const fixture = buildVaultSignatureFixture();
    const transcript = buildVaultRotationTranscript({
      currentRecoveryPublicKey: fixture.recoveryPublicKey,
      signingPublicKey: fixture.devicePublicKey,
    });
    const repository = buildDualRootRotationRepositoryDouble();
    await new FinalizeDualRootRotationHandler(
      repository,
      new VaultSignatureVerifierAdapter(),
    ).execute(signVaultRotation(transcript, fixture));
    expect(repository.finalize).toHaveBeenCalledWith(
      transcript,
      expect.objectContaining({
        deviceSignature: expect.any(String),
        recoverySignature: expect.any(String),
      }),
      expect.any(Number),
    );
  });
  it.each(['device', 'recovery'])(
    'should reject an invalid %s signature without reaching persistence',
    async (proof) => {
      const fixture = buildVaultSignatureFixture();
      const transcript = buildVaultRotationTranscript({
        currentRecoveryPublicKey: fixture.recoveryPublicKey,
        signingPublicKey: fixture.devicePublicKey,
      });
      const repository = buildDualRootRotationRepositoryDouble();
      const command = signVaultRotation(transcript, fixture);
      await expect(
        new FinalizeDualRootRotationHandler(
          repository,
          new VaultSignatureVerifierAdapter(),
        ).execute({
          ...command,
          ...(proof === 'device'
            ? { deviceSignature: '0'.repeat(128) }
            : { recoverySignature: '0'.repeat(128) }),
        }),
      ).rejects.toThrow(DomainError);
      expect(repository.finalize).not.toHaveBeenCalled();
    },
  );
  it('should reject another account before verifying signatures', async () => {
    const fixture = buildVaultSignatureFixture();
    const transcript = buildVaultRotationTranscript();
    const command = signVaultRotation(transcript, fixture);
    const repository = buildDualRootRotationRepositoryDouble();
    const verifier = new VaultSignatureVerifierAdapter();
    const verify = jest.spyOn(verifier, 'verifyDevice');
    await expect(
      new FinalizeDualRootRotationHandler(repository, verifier).execute({
        ...command,
        user: { ...command.user, userId: 'other-user' },
      }),
    ).rejects.toThrow(DomainError);
    expect(verify).not.toHaveBeenCalled();
    expect(repository.finalize).not.toHaveBeenCalled();
  });
  it('should reject auth that expires during recovery verification', async () => {
    const fixture = buildVaultSignatureFixture();
    const transcript = buildVaultRotationTranscript({
      currentRecoveryPublicKey: fixture.recoveryPublicKey,
      signingPublicKey: fixture.devicePublicKey,
    });
    const repository = buildDualRootRotationRepositoryDouble();
    const verifier = new VaultSignatureVerifierAdapter();
    const command = signVaultRotation(transcript, fixture);
    const verify = verifier.verifyRecovery.bind(verifier);
    jest
      .spyOn(verifier, 'verifyRecovery')
      .mockImplementation(async (...args) => {
        const valid = await verify(...args);
        jest
          .spyOn(Date, 'now')
          .mockReturnValue((command.user.authTime ?? 0) + 360_000);
        return valid;
      });
    try {
      await expect(
        new FinalizeDualRootRotationHandler(repository, verifier).execute(
          command,
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(repository.finalize).not.toHaveBeenCalled();
    } finally {
      jest.restoreAllMocks();
    }
  });
});
