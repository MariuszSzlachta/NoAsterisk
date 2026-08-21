import { GetVaultHandler } from './get-vault.handler';
import { VaultRepository } from '@user-settings/domain/ports/vault.repository';
import { Vault } from '@user-settings/domain/vault.entity';

describe('GetVaultHandler', () => {
  let handler: GetVaultHandler;
  let vaultRepo: jest.Mocked<VaultRepository>;

  beforeEach(() => {
    vaultRepo = {
      findByWorkspaceId: jest.fn(),
      save: jest.fn(),
      deleteByWorkspaceId: jest.fn(),
    };
    handler = new GetVaultHandler(vaultRepo);
  });

  afterEach(() => jest.clearAllMocks());

  it('returns vault data when found', async () => {
    const vault = new Vault(
      'vault-1',
      'ws-1',
      'encrypted-blob-data',
      new Date('2026-01-01T10:00:00Z'),
      new Date('2026-01-02T12:00:00Z'),
    );
    vaultRepo.findByWorkspaceId.mockResolvedValue(vault);

    const result = await handler.execute({ workspaceId: 'ws-1' });

    expect(result).toEqual({
      encryptedBlob: 'encrypted-blob-data',
      updatedAt: '2026-01-02T12:00:00.000Z',
    });
    expect(vaultRepo.findByWorkspaceId).toHaveBeenCalledWith('ws-1');
  });

  it('throws NotFoundException when vault not found', async () => {
    vaultRepo.findByWorkspaceId.mockResolvedValue(undefined);

    await expect(handler.execute({ workspaceId: 'ws-1' })).rejects.toThrow(
      'Vault not found',
    );
  });
});
