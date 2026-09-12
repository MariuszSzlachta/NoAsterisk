import { UnauthorizedException } from '@nestjs/common';
import { FinalizeSignedEnrollmentHandler } from '@vault-protocol/application/commands/finalize-signed-enrollment';
import type { FinalizeSignedEnrollmentCommand } from '@vault-protocol/application/commands/finalize-signed-enrollment/types';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';
import { buildSignedEnrollmentRepositoryDouble } from '@vault-protocol/testing/build-signed-enrollment-repository-double';

describe('FinalizeSignedEnrollmentHandler', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  const request: FinalizeSignedEnrollmentCommand['request'] = {
    purpose: 'recovery',
    vaultId: 'vault',
    keyId: 'key',
    deviceId: 'device',
    challenge: 'A'.repeat(43),
    deviceEnvelope: '{}',
    passkeyEnvelope: '{}',
    deviceSignature: 'a'.repeat(128),
    recoverySignature: 'b'.repeat(128),
  };
  it('should preserve both envelopes and proofs while deriving ownership/deadline from the authenticated user', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    const finalize = jest.spyOn(repository, 'finalize');
    await new FinalizeSignedEnrollmentHandler(repository).execute({
      user,
      request,
    });
    expect(finalize).toHaveBeenCalledWith({
      ...request,
      accountId: user.userId,
      workspaceId: user.workspaceId,
      authDeadline: (user.authTime ?? 0) + 300_000,
    });
  });
  it('should reject stale auth without attempting the mutation', async () => {
    const repository = buildSignedEnrollmentRepositoryDouble();
    const user = buildRecoveryRegistrationCommand().user;
    const finalize = jest.spyOn(repository, 'finalize');
    await expect(
      new FinalizeSignedEnrollmentHandler(repository).execute({
        user: { ...user, authTime: Date.now() - 360_000 },
        request,
      }),
    ).rejects.toThrow(UnauthorizedException);
    expect(finalize).not.toHaveBeenCalled();
  });
});
