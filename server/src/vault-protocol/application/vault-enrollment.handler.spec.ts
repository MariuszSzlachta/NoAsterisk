import { UnauthorizedException } from '@nestjs/common';
import { VaultEnrollmentHandler } from './vault-enrollment.handler';
import { InMemoryVaultEnrollmentRepository } from '@vault-protocol/infrastructure/in-memory-vault-enrollment.repository';
import type { CurrentUserPayload } from '@shared/auth/current-user';

const user: CurrentUserPayload = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
  authTime: Date.now(),
  amr: 'password',
};

describe('VaultEnrollmentHandler', () => {
  it('requires fresh auth and explicit recovery confirmation', async () => {
    const handler = new VaultEnrollmentHandler(
      new InMemoryVaultEnrollmentRepository(),
    );
    await expect(
      handler.prepare({ user, deviceId: 'device-1', recoveryConfirmed: false }),
    ).rejects.toThrow('Recovery confirmation required');
    await expect(
      handler.prepare({
        user: { ...user, authTime: Date.now() - 301_000 },
        deviceId: 'device-1',
        recoveryConfirmed: true,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns a transient 32-byte ServerShare preparation', async () => {
    const handler = new VaultEnrollmentHandler(
      new InMemoryVaultEnrollmentRepository(),
    );
    const result = await handler.prepare({
      user,
      deviceId: 'device-1',
      recoveryConfirmed: true,
    });
    expect(result.challenge).toHaveLength(43);
    expect(Buffer.from(result.serverShare, 'base64')).toHaveLength(32);
    expect(result.expiresAt).toEqual(expect.any(String));
  });

  it('rejects a private or malformed signing JWK before persistence', async () => {
    const handler = new VaultEnrollmentHandler(
      new InMemoryVaultEnrollmentRepository(),
    );
    const prepared = await handler.prepare({
      user,
      deviceId: 'device-1',
      recoveryConfirmed: true,
    });
    await expect(
      handler.finalize(user, {
        challenge: prepared.challenge,
        userId: user.userId,
        workspaceId: user.workspaceId,
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceEnvelope: '{}',
        signingPublicKey: JSON.stringify({
          kty: 'EC',
          crv: 'P-256',
          x: 'x',
          y: 'y',
          d: 'private',
        }),
      }),
    ).rejects.toThrow('Invalid device signing key');
  });

  it('rejects context mismatches and malformed public signing keys', async () => {
    const repository = new InMemoryVaultEnrollmentRepository();
    const handler = new VaultEnrollmentHandler(repository);
    const prepared = await handler.prepare({
      user,
      deviceId: 'device-1',
      recoveryConfirmed: true,
    });
    const request = {
      challenge: prepared.challenge,
      userId: user.userId,
      workspaceId: user.workspaceId,
      deviceId: 'device-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceEnvelope: '{}',
      signingPublicKey: '{invalid-json',
    };

    await expect(
      handler.finalize({ ...user, userId: 'other-user' }, request),
    ).rejects.toThrow('Enrollment context mismatch');
    await expect(handler.finalize(user, request)).rejects.toThrow(
      'Invalid device signing key',
    );
    await expect(
      handler.confirm(
        { ...user, workspaceId: 'other-workspace' },
        {
          challenge: prepared.challenge,
          userId: user.userId,
          workspaceId: user.workspaceId,
          deviceId: 'device-1',
          vaultId: 'vault-1',
          keyId: 'key-1',
        },
      ),
    ).rejects.toThrow('Enrollment context mismatch');
  });
});
