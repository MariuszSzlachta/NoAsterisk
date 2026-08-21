import { UploadVaultHandler } from './upload-vault.handler';
import { VaultRepository } from '@user-settings/domain/ports/vault.repository';
import { Vault } from '@user-settings/domain/vault.entity';

describe('UploadVaultHandler', () => {
  let handler: UploadVaultHandler;
  let vaultRepo: jest.Mocked<VaultRepository>;

  beforeEach(() => {
    vaultRepo = {
      findByWorkspaceId: jest.fn().mockResolvedValue(undefined),
      save: jest.fn(),
      deleteByWorkspaceId: jest.fn(),
    };
    handler = new UploadVaultHandler(vaultRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('creates new vault when none exists', async () => {
    const result = await handler.execute({
      workspaceId: 'ws-1',
      encryptedBlob: 'encrypted-data',
    });

    expect(result.updatedAt).toBeDefined();
    expect(vaultRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        encryptedBlob: 'encrypted-data',
      }),
    );
  });

  it('updates existing vault', async () => {
    const existingVault = new Vault(
      'vault-1',
      'ws-1',
      'old-data',
      new Date('2026-01-01'),
      new Date('2026-01-01'),
    );
    vaultRepo.findByWorkspaceId.mockResolvedValue(existingVault);

    const result = await handler.execute({
      workspaceId: 'ws-1',
      encryptedBlob: 'new-data',
    });

    expect(result.updatedAt).toBeDefined();
    expect(vaultRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'vault-1',
        workspaceId: 'ws-1',
        encryptedBlob: 'new-data',
      }),
    );
  });
});
