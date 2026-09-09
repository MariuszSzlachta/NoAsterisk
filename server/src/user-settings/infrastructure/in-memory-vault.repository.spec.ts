import { Vault } from '@user-settings/domain/vault.entity';
import { InMemoryVaultRepository } from '@user-settings/infrastructure/in-memory-vault.repository';

describe('InMemoryVaultRepository', () => {
  const createVault = (
    workspaceId: string,
    blob: string,
    revision = 1,
  ): Vault =>
    new Vault(
      `vault-${workspaceId}`,
      workspaceId,
      blob,
      `hash-${blob}`,
      blob.length,
      revision,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );

  it('creates the first snapshot at revision one', async () => {
    const repository = new InMemoryVaultRepository();
    const vault = createVault('workspace-a', 'ciphertext-a');

    await expect(repository.saveIfRevisionMatches(vault, 0)).resolves.toEqual({
      status: 'saved',
      vault,
    });
    await expect(repository.findByWorkspaceId('workspace-a')).resolves.toEqual(
      vault,
    );
  });

  it('rejects a stale writer and preserves the current snapshot', async () => {
    const repository = new InMemoryVaultRepository();
    const original = createVault('workspace-a', 'ciphertext-a');
    const newer = createVault('workspace-a', 'ciphertext-b', 2);
    const stale = createVault('workspace-a', 'ciphertext-c', 2);

    await repository.saveIfRevisionMatches(original, 0);
    await repository.saveIfRevisionMatches(newer, 1);

    await expect(repository.saveIfRevisionMatches(stale, 1)).resolves.toEqual({
      status: 'conflict',
    });
    await expect(repository.findByWorkspaceId('workspace-a')).resolves.toEqual(
      newer,
    );
  });

  it('makes a repeated identical upload idempotent', async () => {
    const repository = new InMemoryVaultRepository();
    const vault = createVault('workspace-a', 'ciphertext-a');

    await repository.saveIfRevisionMatches(vault, 0);

    await expect(repository.saveIfRevisionMatches(vault, 0)).resolves.toEqual({
      status: 'saved',
      vault,
    });
  });

  it('keeps workspaces isolated', async () => {
    const repository = new InMemoryVaultRepository();
    const vault = createVault('workspace-a', 'ciphertext-a');

    await repository.saveIfRevisionMatches(vault, 0);

    await expect(
      repository.findByWorkspaceId('workspace-b'),
    ).resolves.toBeUndefined();
    await expect(
      repository.saveIfRevisionMatches(
        createVault('workspace-b', 'ciphertext-b'),
        0,
      ),
    ).resolves.toMatchObject({ status: 'saved' });
  });
});
