import { InMemoryVaultEnrollmentRepository } from './in-memory-vault-enrollment.repository';

describe('InMemoryVaultEnrollmentRepository', () => {
  it('binds preparation and finalization to the user, workspace and device once', async () => {
    const repository = new InMemoryVaultEnrollmentRepository();
    const prepared = await repository.prepare(
      'user-1',
      'workspace-1',
      'device-1',
    );
    await expect(
      repository.finalize({
        challenge: prepared.challenge,
        userId: 'user-1',
        workspaceId: 'workspace-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceEnvelope: '{}',
        signingPublicKey: '{}',
      }),
    ).resolves.toBeUndefined();
    await expect(
      repository.confirm({
        challenge: prepared.challenge,
        userId: 'user-1',
        workspaceId: 'workspace-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
      }),
    ).resolves.toBeUndefined();
    await expect(
      repository.confirm({
        challenge: prepared.challenge,
        userId: 'user-1',
        workspaceId: 'workspace-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
      }),
    ).rejects.toThrow('Invalid enrollment confirmation');
    await expect(
      repository.finalize({
        challenge: prepared.challenge,
        userId: 'user-1',
        workspaceId: 'workspace-1',
        deviceId: 'device-1',
        vaultId: 'vault-1',
        keyId: 'key-1',
        deviceEnvelope: '{}',
        signingPublicKey: '{}',
      }),
    ).rejects.toThrow('Invalid enrollment challenge');
  });
});
