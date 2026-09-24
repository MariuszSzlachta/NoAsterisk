import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InMemoryVaultRotationRepository } from '@vault-protocol/infrastructure/in-memory-vault-rotation.repository';
import { RotateVaultHandler } from '@vault-protocol/application/rotate-vault.handler';

const user: Parameters<RotateVaultHandler['execute']>[0]['user'] = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
  authTime: Date.now(),
  amr: 'password',
};

const command: Parameters<RotateVaultHandler['execute']>[0] = {
  user,
  vaultId: 'vault-1',
  deviceId: 'device-1',
  currentKeyId: 'key-1',
  nextKeyId: 'key-2',
  envelopePurpose: 'device-wrap',
  envelope: 'opaque-envelope',
  recoveryConfirmed: true,
  idempotencyKey: 'rotation-1',
};

describe('RotateVaultHandler', () => {
  it('requires fresh authentication and recovery confirmation', async () => {
    const repository = new InMemoryVaultRotationRepository();
    repository.seed({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      envelope: 'old',
      purpose: 'device-wrap',
      devices: 2,
    });
    const handler = new RotateVaultHandler(repository);
    await expect(
      handler.execute({
        ...command,
        user: { ...user, authTime: Date.now() - 301_000 },
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      handler.execute({ ...command, recoveryConfirmed: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rotates the key and revokes other devices atomically', async () => {
    const repository = new InMemoryVaultRotationRepository();
    repository.seed({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      envelope: 'old',
      purpose: 'device-wrap',
      devices: 3,
    });
    const handler = new RotateVaultHandler(repository);
    await expect(handler.execute(command)).resolves.toEqual({
      status: 'rotated',
      keyId: 'key-2',
      revokedDeviceCount: 2,
    });
    await expect(handler.execute(command)).resolves.toEqual({
      status: 'rotated',
      keyId: 'key-2',
      revokedDeviceCount: 2,
    });
    await expect(
      handler.execute({ ...command, envelope: 'substituted-envelope' }),
    ).rejects.toThrow('idempotency conflict');
  });

  it('rejects a stale key and equal key ids', async () => {
    const repository = new InMemoryVaultRotationRepository();
    repository.seed({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      envelope: 'old',
      purpose: 'device-wrap',
      devices: 1,
    });
    const handler = new RotateVaultHandler(repository);
    await handler.execute(command);
    await expect(
      handler.execute({ ...command, idempotencyKey: 'rotation-2' }),
    ).rejects.toThrow('Vault key has changed');
    await expect(
      handler.execute({
        ...command,
        nextKeyId: 'key-1',
        idempotencyKey: 'rotation-3',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a secondary PRF envelope for a PRF-only rotation', async () => {
    const repository = new InMemoryVaultRotationRepository();
    repository.seed({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      envelope: 'old',
      purpose: 'passkey-wrap',
      devices: 1,
    });
    const handler = new RotateVaultHandler(repository);
    await expect(
      handler.execute({
        ...command,
        envelopePurpose: 'passkey-wrap',
        passkeyEnvelope: 'secondary-envelope',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
