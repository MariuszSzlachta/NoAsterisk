import { GoneException } from '@nestjs/common';
import { UserSettingsController } from './user-settings.controller';
import type { CurrentUserPayload } from '@auth/presentation/decorators/current-user.decorator';
import type { ChangePasswordHandler } from '@user-settings/application/commands/change-password.handler';
import type { DeleteAccountHandler } from '@user-settings/application/commands/delete-account.handler';
import type { LogoutHandler } from '@user-settings/application/commands/logout.handler';
import type { UpdatePreferencesHandler } from '@user-settings/application/commands/update-preferences.handler';
import type { UpdateProfileHandler } from '@user-settings/application/commands/update-profile.handler';
import type { UploadVaultHandler } from '@user-settings/application/commands/upload-vault.handler';
import type { GetProfileHandler } from '@user-settings/application/queries/get-profile.handler';
import type { GetVaultHandler } from '@user-settings/application/queries/get-vault.handler';

const user: CurrentUserPayload = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
};

const buildController = (): UserSettingsController => {
  const dependency = { execute: jest.fn() };
  return new UserSettingsController(
    dependency as unknown as ChangePasswordHandler,
    dependency as unknown as UpdateProfileHandler,
    dependency as unknown as UpdatePreferencesHandler,
    dependency as unknown as UploadVaultHandler,
    dependency as unknown as DeleteAccountHandler,
    dependency as unknown as LogoutHandler,
    dependency as unknown as GetProfileHandler,
    dependency as unknown as GetVaultHandler,
  );
};

describe('UserSettingsController legacy vault boundary', () => {
  it('rejects v1 vault writes without invoking the legacy handler', async () => {
    const controller = buildController();

    await expect(
      controller.uploadVault(user, { encryptedBlob: 'YQ==', baseRevision: 0 }),
    ).rejects.toBeInstanceOf(GoneException);
  });

  it('rejects v1 vault reads before exposing legacy ciphertext', async () => {
    const controller = buildController();

    await expect(controller.getVault(user)).rejects.toBeInstanceOf(
      GoneException,
    );
  });
});
