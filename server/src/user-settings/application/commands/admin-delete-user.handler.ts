import { Injectable, Inject } from '@nestjs/common';
import { DomainError } from '@budget/domain';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PERMISSION_REPOSITORY,
  PermissionRepository,
} from '@auth/domain/ports/permission.repository';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { VAULT_REPOSITORY } from '@user-settings/domain/ports/vault-token';

export interface AdminDeleteUserCommand {
  targetUserId: string;
  requesterId: string;
}

@Injectable()
export class AdminDeleteUserHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
    @Inject(VAULT_REPOSITORY)
    private readonly vaultRepo: VaultRepository,
  ) {}

  async execute(command: AdminDeleteUserCommand): Promise<void> {
    if (command.targetUserId === command.requesterId) {
      throw new DomainError('Cannot delete your own account');
    }

    const user = await this.userRepo.findById(command.targetUserId);
    if (!user) {
      throw new DomainError('User not found');
    }

    if (user.isSuperuser()) {
      throw new DomainError('Cannot delete a Superuser');
    }

    await this.vaultRepo.deleteByWorkspaceId(user.workspaceId);
    await this.permissionRepo.deleteByUserId(command.targetUserId);
    await this.userRepo.delete(command.targetUserId);
  }
}
