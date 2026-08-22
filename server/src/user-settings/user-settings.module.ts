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
import { VAULT_REPOSITORY } from '@user-settings/domain/ports/vault.repository';
import { InMemoryVaultRepository } from '@user-settings/infrastructure/in-memory-vault.repository';
import { PostgresVaultRepository } from '@user-settings/infrastructure/postgres-vault.repository';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';

@Module({
  imports: [AuthModule],
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
    createRepositoryProvider(
      VAULT_REPOSITORY,
      PostgresVaultRepository,
      InMemoryVaultRepository,
    ),
  ],
  exports: [BlockUserHandler, AdminDeleteUserHandler, GetAllUsersHandler],
})
export class UserSettingsModule {}
