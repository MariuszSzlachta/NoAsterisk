import { InMemoryAccountDeletionRepository } from '@user-settings/infrastructure/in-memory-account-deletion.repository';
import type { InMemoryAccountDeletionDependencies } from '@user-settings/application/ports/in-memory-account-deletion.dependencies';

const createDependencies = (
  users: ReadonlyArray<{ readonly id: string; readonly workspaceId: string }>,
): InMemoryAccountDeletionDependencies => ({
  findWorkspaceUsers: jest.fn().mockResolvedValue(users),
  deleteUser: jest.fn().mockResolvedValue(undefined),
  deletePermissions: jest.fn().mockResolvedValue(undefined),
  deleteInviteReferences: jest.fn().mockResolvedValue(undefined),
  deleteVault: jest.fn().mockResolvedValue(undefined),
  deleteWorkspace: jest.fn().mockResolvedValue(undefined),
});

describe('InMemoryAccountDeletionRepository', () => {
  it('deletes the workspace when the user is its sole member', async () => {
    const dependencies = createDependencies([
      { id: 'user-1', workspaceId: 'workspace-1' },
    ]);
    const repository = new InMemoryAccountDeletionRepository(dependencies);

    await repository.deleteUserOwnedData('user-1', 'workspace-1');

    expect(dependencies.deleteInviteReferences).toHaveBeenCalledWith('user-1');
    expect(dependencies.deletePermissions).toHaveBeenCalledWith('user-1');
    expect(dependencies.deleteVault).toHaveBeenCalledWith('workspace-1');
    expect(dependencies.deleteUser).toHaveBeenCalledWith('user-1');
    expect(dependencies.deleteWorkspace).toHaveBeenCalledWith('workspace-1');
  });

  it('keeps the workspace when another member remains', async () => {
    const dependencies = createDependencies([
      { id: 'user-1', workspaceId: 'workspace-1' },
      { id: 'user-2', workspaceId: 'workspace-1' },
    ]);
    const repository = new InMemoryAccountDeletionRepository(dependencies);

    await repository.deleteUserOwnedData('user-1', 'workspace-1');

    expect(dependencies.deleteWorkspace).not.toHaveBeenCalled();
  });
});
