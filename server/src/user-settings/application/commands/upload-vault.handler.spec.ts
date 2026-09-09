import { UploadVaultHandler } from './upload-vault.handler';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { Vault } from '@user-settings/domain/vault.entity';

describe('UploadVaultHandler', () => {
  let handler: UploadVaultHandler;
  let vaultRepo: jest.Mocked<VaultRepository>;

  beforeEach(() => {
    vaultRepo = {
      findByWorkspaceId: jest.fn().mockResolvedValue(undefined),
      saveIfRevisionMatches: jest.fn().mockImplementation(async (vault) => ({
        status: 'saved',
        vault,
      })),
      deleteByWorkspaceId: jest.fn(),
    };
    handler = new UploadVaultHandler(vaultRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('creates new vault when none exists', async () => {
    const result = await handler.execute({
      workspaceId: 'ws-1',
      encryptedBlob: 'encrypted-data',
      baseRevision: 0,
    });

    expect(result.updatedAt).toBeDefined();
    expect(vaultRepo.saveIfRevisionMatches).toHaveBeenCalled();
  });

  it('updates existing vault', async () => {
    const existingVault = new Vault(
      'vault-1',
      'ws-1',
      'old-data',
      'old-hash',
      8,
      1,
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );
    vaultRepo.findByWorkspaceId.mockResolvedValue(existingVault);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      encryptedBlob: 'new-data',
      baseRevision: 1,
    });

    expect(result.updatedAt).toBeDefined();
    expect(vaultRepo.saveIfRevisionMatches).toHaveBeenCalled();
  });

  it('rejects a stale revision', async () => {
    vaultRepo.saveIfRevisionMatches.mockResolvedValue({ status: 'conflict' });

    await expect(
      handler.execute({
        workspaceId: 'ws-1',
        encryptedBlob: 'new-data',
        baseRevision: 1,
      }),
    ).rejects.toThrow('Vault revision conflict');
  });
});
