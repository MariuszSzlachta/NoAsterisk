import { beforeEach, describe, expect, it, vi } from 'vitest';

import { persistenceSyncMetadata } from '#shared/adapters/persistence/sync-metadata';

describe('persistenceSyncMetadata', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists dirty and successful sync metadata without secrets', () => {
    persistenceSyncMetadata.markDirty();
    expect(persistenceSyncMetadata.get()).toMatchObject({ isDirty: true });

    persistenceSyncMetadata.rememberRevision(3);
    expect(persistenceSyncMetadata.get().observedRevision).toBe(3);

    persistenceSyncMetadata.markSynced(4, '2026-09-09T12:00:00.000Z');
    expect(persistenceSyncMetadata.get()).toEqual({
      observedRevision: 4,
      lastSuccessfulSyncRevision: 4,
      lastSuccessfulSyncAt: '2026-09-09T12:00:00.000Z',
      isDirty: false,
    });
    expect(localStorage.getItem('budget-sync-metadata')).not.toContain(
      'password',
    );
  });

  it('notifies subscribers when metadata changes', () => {
    const listener = vi.fn();
    const unsubscribe = persistenceSyncMetadata.subscribe(listener);

    persistenceSyncMetadata.markDirty();
    unsubscribe();
    persistenceSyncMetadata.rememberRevision(2);

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('reads valid persisted metadata', async () => {
    localStorage.setItem(
      'budget-sync-metadata',
      JSON.stringify({
        observedRevision: 7,
        lastSuccessfulSyncRevision: 6,
        lastSuccessfulSyncAt: '2026-09-09T12:00:00.000Z',
        isDirty: true,
      }),
    );

    vi.resetModules();
    const freshModule =
      await import('#shared/adapters/persistence/sync-metadata/sync-metadata');

    expect(freshModule.persistenceSyncMetadata.get()).toEqual({
      observedRevision: 7,
      lastSuccessfulSyncRevision: 6,
      lastSuccessfulSyncAt: '2026-09-09T12:00:00.000Z',
      isDirty: true,
    });
  });

  it('sanitizes invalid persisted metadata fields', async () => {
    localStorage.setItem(
      'budget-sync-metadata',
      JSON.stringify({
        observedRevision: '7',
        lastSuccessfulSyncRevision: '6',
        lastSuccessfulSyncAt: 12,
        isDirty: false,
      }),
    );

    vi.resetModules();
    const freshModule =
      await import('#shared/adapters/persistence/sync-metadata/sync-metadata');

    expect(freshModule.persistenceSyncMetadata.get()).toEqual({
      observedRevision: undefined,
      lastSuccessfulSyncRevision: undefined,
      lastSuccessfulSyncAt: undefined,
      isDirty: false,
    });
  });

  it('keeps in-memory metadata when storage cannot be written', () => {
    const setItem = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new Error('storage unavailable');
      });

    expect(() => persistenceSyncMetadata.markDirty()).not.toThrow();
    expect(persistenceSyncMetadata.get().isDirty).toBe(true);

    setItem.mockRestore();
  });

  it('uses safe defaults for malformed metadata and unavailable storage', async () => {
    localStorage.setItem('budget-sync-metadata', '{invalid');
    vi.resetModules();
    const freshModule =
      await import('#shared/adapters/persistence/sync-metadata/sync-metadata');
    expect(freshModule.persistenceSyncMetadata.get().isDirty).toBe(false);

    const storedLocalStorage = globalThis.localStorage;
    vi.stubGlobal('localStorage', undefined);
    vi.resetModules();
    const unavailableModule =
      await import('#shared/adapters/persistence/sync-metadata/sync-metadata');
    expect(
      unavailableModule.persistenceSyncMetadata.get().observedRevision,
    ).toBeUndefined();
    unavailableModule.persistenceSyncMetadata.markDirty();
    vi.stubGlobal('localStorage', storedLocalStorage);
  });
});
