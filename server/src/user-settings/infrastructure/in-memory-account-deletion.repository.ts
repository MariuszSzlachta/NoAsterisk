import { Inject, Injectable } from '@nestjs/common';
import { AccountDeletionRepository } from '@user-settings/application/ports/account-deletion.repository';
import { IN_MEMORY_ACCOUNT_DELETION_DEPENDENCIES } from '@user-settings/application/ports/in-memory-account-deletion.token';
import type { InMemoryAccountDeletionDependencies } from '@user-settings/application/ports/in-memory-account-deletion.dependencies';

@Injectable()
export class InMemoryAccountDeletionRepository implements AccountDeletionRepository {
  constructor(
    @Inject(IN_MEMORY_ACCOUNT_DELETION_DEPENDENCIES)
    private readonly dependencies: InMemoryAccountDeletionDependencies,
  ) {}

  async deleteUserOwnedData(
    userId: string,
    workspaceId: string,
  ): Promise<void> {
    const workspaceUsers = (
      await this.dependencies.findWorkspaceUsers()
    ).filter((user) => user.workspaceId === workspaceId);
    const isSoleWorkspaceUser =
      workspaceUsers.length === 1 && workspaceUsers[0]?.id === userId;
    await this.dependencies.deleteInviteReferences(userId);
    await this.dependencies.deletePermissions(userId);
    await this.dependencies.deleteVault(workspaceId);
    await this.dependencies.deleteUser(userId);
    if (isSoleWorkspaceUser) {
      await this.dependencies.deleteWorkspace(workspaceId);
    }
  }
}
