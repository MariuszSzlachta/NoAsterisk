import { InMemoryVaultSecurityRepository } from '@vault-protocol/infrastructure/in-memory-vault-security.repository';

describe('InMemoryVaultSecurityRepository', () => {
  it('records high-security per account, workspace, vault and device', async () => {
    const repository = new InMemoryVaultSecurityRepository();
    await repository.enableHighSecurity({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'opaque',
    });

    expect(
      repository.isHighSecurityEnabled(
        'user-1',
        'workspace-1',
        'vault-1',
        'device-1',
      ),
    ).toBe(true);
    expect(
      repository.isHighSecurityEnabled(
        'user-1',
        'workspace-2',
        'vault-1',
        'device-1',
      ),
    ).toBe(false);
    expect(
      repository.isHighSecurityEnabled(
        'user-1',
        'workspace-1',
        'vault-2',
        'device-1',
      ),
    ).toBe(false);
  });

  it('keeps standard PRF enrollment separate from high-security state', async () => {
    const repository = new InMemoryVaultSecurityRepository();
    await repository.enablePasskeyUnlock({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      vaultId: 'vault-1',
      keyId: 'key-1',
      deviceId: 'device-1',
      passkeyEnvelope: 'opaque',
    });

    expect(
      repository.isHighSecurityEnabled(
        'user-1',
        'workspace-1',
        'vault-1',
        'device-1',
      ),
    ).toBe(false);
  });
});
