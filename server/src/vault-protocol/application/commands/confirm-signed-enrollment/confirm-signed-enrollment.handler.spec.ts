import { UnauthorizedException } from '@nestjs/common';
import { ConfirmSignedEnrollmentHandler } from '@vault-protocol/application/commands/confirm-signed-enrollment';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';
import { buildSignedEnrollmentRepositoryDouble } from '@vault-protocol/testing/build-signed-enrollment-repository-double';

describe('ConfirmSignedEnrollmentHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  const request = {
    vaultId: 'vault',
    keyId: 'key',
    deviceId: 'device',
    challenge: 'A'.repeat(43),
    digest: 'a'.repeat(64),
    signature: 'b'.repeat(128),
  };
  it('should preserve the digest-bound proof and derive ownership/deadline only from the authenticated user', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    const confirm = jest.spyOn(repository, 'confirm');
    await new ConfirmSignedEnrollmentHandler(repository).execute({
      user,
      request,
    });
    expect(confirm).toHaveBeenCalledWith({
      ...request,
      accountId: user.userId,
      workspaceId: user.workspaceId,
      authDeadline: (user.authTime ?? 0) + 300_000,
    });
  });
  it('should reject missing interactive auth without attempting to activate a device', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    const confirm = jest.spyOn(repository, 'confirm');
    await expect(
      new ConfirmSignedEnrollmentHandler(repository).execute({
        user: { ...user, authTime: undefined },
        request,
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(confirm).not.toHaveBeenCalled();
  });
});
