import { Module } from '@nestjs/common';
import { AuthModule } from '@auth/auth.module';
import { UserSettingsController } from '@user-settings/presentation/user-settings.controller';
import { AdminUsersController } from '@user-settings/presentation/admin-users.controller';
import { ChangePasswordHandler } from '@user-settings/application/commands/change-password.handler';
import { UpdateProfileHandler } from '@user-settings/application/commands/update-profile.handler';
import { UpdatePreferencesHandler } from '@user-settings/application/commands/update-preferences.handler';
import { UploadVaultHandler } from '@user-settings/application/commands/upload-vault.handler';
import { DeleteAccountHandler } from '@user-settings/application/commands/delete-account.handler';
import { LogoutHandler } from '@user-settings/application/commands/logout.handler';
import { BlockUserHandler } from '@user-settings/application/commands/block-user.handler';
import { AdminDeleteUserHandler } from '@user-settings/application/commands/admin-delete-user.handler';
import { GetProfileHandler } from '@user-settings/application/queries/get-profile.handler';
import { GetVaultHandler } from '@user-settings/application/queries/get-vault.handler';
import { GetAllUsersHandler } from '@user-settings/application/queries/get-all-users.handler';
import { VAULT_REPOSITORY } from '@user-settings/domain/ports/vault-token';
import { InMemoryVaultRepository } from '@user-settings/infrastructure/in-memory-vault.repository';
import { PostgresVaultRepository } from '@user-settings/infrastructure/postgres-vault.repository';
import { InMemoryAccountDeletionRepository } from '@user-settings/infrastructure/in-memory-account-deletion.repository';
import { PostgresAccountDeletionRepository } from '@user-settings/infrastructure/postgres-account-deletion.repository';
import { ACCOUNT_DELETION_REPOSITORY } from '@user-settings/application/ports/account-deletion-token';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';
import { WorkspacesModule } from '@workspaces/workspaces.module';
import { InviteCodesModule } from '@invite-codes/invite-codes.module';
import {
  USER_REPOSITORY,
  UserRepository,
} from '@auth/domain/ports/user.repository';
import {
  PERMISSION_REPOSITORY,
  PermissionRepository,
} from '@auth/domain/ports/permission.repository';
import {
  INVITE_CODE_REPOSITORY,
  InviteCodeRepository,
} from '@invite-codes/domain/ports/invite-code.repository';
import {
  WORKSPACE_REPOSITORY,
  WorkspaceRepository,
} from '@workspaces/domain/ports/workspace.repository';
import { InviteCode } from '@invite-codes/domain/invite-code.entity';
import { VaultRepository } from '@user-settings/domain/ports/vault-repository';
import { InMemoryAccountDeletionDependencies } from '@user-settings/application/ports/in-memory-account-deletion.dependencies';
import { IN_MEMORY_ACCOUNT_DELETION_DEPENDENCIES } from '@user-settings/application/ports/in-memory-account-deletion.token';

@Module({
  imports: [AuthModule, WorkspacesModule, InviteCodesModule],
  controllers: [UserSettingsController, AdminUsersController],
  providers: [
    ChangePasswordHandler,
    UpdateProfileHandler,
    UpdatePreferencesHandler,
    UploadVaultHandler,
    DeleteAccountHandler,
    LogoutHandler,
    BlockUserHandler,
    AdminDeleteUserHandler,
    GetProfileHandler,
    GetVaultHandler,
    GetAllUsersHandler,
    {
      provide: IN_MEMORY_ACCOUNT_DELETION_DEPENDENCIES,
      useFactory: (
        users: UserRepository,
        permissions: PermissionRepository,
        inviteCodes: InviteCodeRepository,
        workspaces: WorkspaceRepository,
        vaults: VaultRepository,
      ): InMemoryAccountDeletionDependencies => ({
        findWorkspaceUsers: () => users.findAll(),
        deleteUser: (userId) => users.delete(userId),
        deletePermissions: (userId) => permissions.deleteByUserId(userId),
        deleteInviteReferences: async (userId) => {
          const codes = await inviteCodes.findAll();
          await Promise.all(
            codes
              .filter((code) => code.createdBy === userId)
              .map((code) => inviteCodes.delete(code.id)),
          );
          await Promise.all(
            codes
              .filter(
                (code) => code.createdBy !== userId && code.usedBy === userId,
              )
              .map((code) =>
                inviteCodes.save(
                  new InviteCode(
                    code.id,
                    code.code,
                    code.createdBy,
                    code.status,
                    code.createdAt,
                    code.expiresAt,
                    undefined,
                    undefined,
                  ),
                ),
              ),
          );
        },
        deleteVault: (workspaceId) => vaults.deleteByWorkspaceId(workspaceId),
        deleteWorkspace: (workspaceId) => workspaces.delete(workspaceId),
      }),
      inject: [
        USER_REPOSITORY,
        PERMISSION_REPOSITORY,
        INVITE_CODE_REPOSITORY,
        WORKSPACE_REPOSITORY,
        VAULT_REPOSITORY,
      ],
    },
    createRepositoryProvider(
      VAULT_REPOSITORY,
      PostgresVaultRepository,
      InMemoryVaultRepository,
    ),
    createRepositoryProvider(
      ACCOUNT_DELETION_REPOSITORY,
      PostgresAccountDeletionRepository,
      InMemoryAccountDeletionRepository,
    ),
  ],
  exports: [BlockUserHandler, AdminDeleteUserHandler, GetAllUsersHandler],
})
export class UserSettingsModule {}
