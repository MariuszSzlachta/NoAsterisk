import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PASSWORD_HASHER,
  PasswordHasherPort,
} from '@auth/domain/ports/password-hasher.port';
import {
  PERMISSION_REPOSITORY,
  PermissionRepository,
} from '@auth/domain/ports/permission.repository';
import {
  VAULT_REPOSITORY,
  VaultRepository,
} from '@user-settings/domain/ports/vault.repository';
import { DomainError } from '@budget/domain';

export interface DeleteAccountCommand {
  userId: string;
  workspaceId: string;
  password: string;
}

export interface DeleteAccountResult {
  success: true;
}

@Injectable()
export class DeleteAccountHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepo: PermissionRepository,
    @Inject(VAULT_REPOSITORY) private readonly vaultRepo: VaultRepository,
  ) {}

  async execute(command: DeleteAccountCommand): Promise<DeleteAccountResult> {
    const user = await this.userRepo.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.workspaceId !== command.workspaceId) {
      throw new DomainError('Workspace mismatch');
    }

    const isValid = await this.hasher.compare(
      command.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new DomainError('Password is incorrect');
    }

    await this.vaultRepo.deleteByWorkspaceId(command.workspaceId);
    await this.permissionRepo.deleteByUserId(command.userId);
    await this.userRepo.delete(command.userId);

    // ARCH-EXCEPTION: Domain data (transactions, categories, budgets, import batches, workspace)
    // not deleted on account deletion. Single-user workspace means orphaned data is inaccessible.
    // Planned resolution: Phase 5 — cascade delete via domain events or explicit cleanup service.

    return { success: true };
  }
}
