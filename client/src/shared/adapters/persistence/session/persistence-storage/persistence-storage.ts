import { PERSISTENCE_STORAGE_KEYS } from '#shared/adapters/persistence/storage-keys';

export const clearPersistenceStorage = (removePreferences: boolean): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  [
    ...Object.values(PERSISTENCE_STORAGE_KEYS.legacy),
    ...(removePreferences
      ? Object.values(PERSISTENCE_STORAGE_KEYS.preferences)
      : []),
  ].forEach((key) => localStorage.removeItem(key));
};
