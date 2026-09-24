import { GoneException } from '@nestjs/common';
import { UserSettingsController } from './user-settings.controller';
import type { CurrentUserPayload } from '@auth/presentation/decorators/current-user.decorator';

const user: CurrentUserPayload = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  role: 'Member',
};

const buildController = (): UserSettingsController => {
  const dependency = { execute: jest.fn() };
  return new UserSettingsController(
    dependency,
    dependency,
    dependency,
    dependency,
    dependency,
    dependency,
    dependency,
    dependency,
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
