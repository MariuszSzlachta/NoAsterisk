import { encryptedPersistence } from '#shared/adapters/persistence/session';

export const persistInBackground = (operation: Promise<void>): void => {
  const wasUnlocked = encryptedPersistence.isUnlocked();
  void operation.catch((error: unknown) => {
    if (!wasUnlocked || !encryptedPersistence.isUnlocked()) {
      return;
    }
    encryptedPersistence.failClosed(error);
  });
};
