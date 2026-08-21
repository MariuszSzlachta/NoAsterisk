import { Module } from '@nestjs/common';
import { AuthModule } from '@auth/auth.module';
import { UserSettingsController } from '@user-settings/presentation/user-settings.controller';
import { ChangePasswordHandler } from '@user-settings/application/commands/change-password.handler';
import { UpdateProfileHandler } from '@user-settings/application/commands/update-profile.handler';
import { UploadVaultHandler } from '@user-settings/application/commands/upload-vault.handler';
import { DeleteAccountHandler } from '@user-settings/application/commands/delete-account.handler';
import { LogoutHandler } from '@user-settings/application/commands/logout.handler';
import { GetProfileHandler } from '@user-settings/application/queries/get-profile.handler';
import { GetVaultHandler } from '@user-settings/application/queries/get-vault.handler';
import { VAULT_REPOSITORY } from '@user-settings/domain/ports/vault.repository';
import { InMemoryVaultRepository } from '@user-settings/infrastructure/in-memory-vault.repository';

@Module({
  imports: [AuthModule],
  controllers: [UserSettingsController],
  providers: [
    ChangePasswordHandler,
    UpdateProfileHandler,
    UploadVaultHandler,
    DeleteAccountHandler,
    LogoutHandler,
    GetProfileHandler,
    GetVaultHandler,
    { provide: VAULT_REPOSITORY, useClass: InMemoryVaultRepository },
  ],
})
export class UserSettingsModule {}
