import { UnauthorizedException } from '@nestjs/common';
import { VaultDeviceHandler } from './vault-device.handler';
import { InMemoryVaultDeviceRepository } from '@vault-protocol/infrastructure/in-memory-vault-device.repository';

const user = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member' as const,
  authTime: Date.now(),
  amr: 'password' as const,
};

describe('VaultDeviceHandler', () => {
  it('lists only repository-owned device summaries', async () => {
    const repository = new InMemoryVaultDeviceRepository();
    repository.seed({
      deviceId: 'device-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      status: 'active',
      createdAt: '2026-09-12T00:00:00.000Z',
      lastSeenAt: '2026-09-12T00:00:00.000Z',
    });
    await expect(
      new VaultDeviceHandler(repository).list(user),
    ).resolves.toHaveLength(1);
  });

  it('requires fresh auth before revocation and marks the device revoked', async () => {
    const repository = new InMemoryVaultDeviceRepository();
    repository.seed({
      deviceId: 'device-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      status: 'active',
      createdAt: '2026-09-12T00:00:00.000Z',
      lastSeenAt: '2026-09-12T00:00:00.000Z',
    });
    const handler = new VaultDeviceHandler(repository);
    await expect(
      handler.revoke({ ...user, authTime: Date.now() - 301_000 }, 'device-1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await handler.revoke(user, 'device-1');
    await expect(handler.list(user)).resolves.toMatchObject([
      { deviceId: 'device-1', status: 'revoked' },
    ]);
  });
});
