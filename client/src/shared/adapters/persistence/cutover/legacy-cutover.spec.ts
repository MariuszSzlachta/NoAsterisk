import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { performLegacyCutover } from '#shared/adapters/persistence/cutover';

const buildStorage = () => {
  const values = new Map<string, string>();
  return {
    values,
    indexedDb: indexedDB,
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    broadcast: vi.fn(),
  };
};

describe('legacy financial-data cutover', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('deletes only exact databases and metadata, then records a marker', async () => {
    const databaseName = `budgetflow-cutover-${crypto.randomUUID()}`;
    const database = indexedDB.open(databaseName, 1);
    await new Promise<void>((resolve, reject) => {
      database.onupgradeneeded = () =>
        database.result.createObjectStore('records');
      database.onsuccess = () => {
        database.result.close();
        resolve();
      };
      database.onerror = () => reject(database.error);
    });
    const storage = buildStorage();
    storage.values.set('legacy-sync', 'present');

    const result = await performLegacyCutover(
      [databaseName],
      ['legacy-sync'],
      storage,
      {
        allowlistedDatabaseNames: [databaseName],
        allowlistedStorageKeys: ['legacy-sync'],
      },
    );

    expect(result.status).toBe('completed');
    expect(storage.values.get('legacy-sync')).toBeUndefined();
    expect(storage.values.get('budgetflow-v2-cutover-marker:default')).toBe(
      'v2-reset-complete',
    );
    expect(storage.broadcast).toHaveBeenCalledWith({
      type: 'database-deleting',
    });
    expect(await indexedDB.databases()).not.toContainEqual(
      expect.objectContaining({ name: databaseName }),
    );
  });

  it('is idempotent and does not touch unrelated storage', async () => {
    const storage = buildStorage();
    storage.values.set('unrelated', 'keep');
    storage.values.set(
      'budgetflow-v2-cutover-marker:default',
      'v2-reset-complete',
    );

    const result = await performLegacyCutover(
      ['not-created'],
      ['unrelated'],
      storage,
    );

    expect(result).toEqual({
      status: 'already-completed',
      deletedDatabases: [],
      deletedStorageKeys: [],
    });
    expect(storage.values.get('unrelated')).toBe('keep');
    expect(storage.broadcast).not.toHaveBeenCalled();
  });

  it('supports a non-destructive rehearsal and rejects wildcard scope', async () => {
    const storage = buildStorage();
    const lockOnFailure = vi.fn();
    await expect(
      performLegacyCutover(['budgetflow-*'], [], storage, {
        dryRun: true,
        lockOnFailure,
      }),
    ).rejects.toThrow('exact allowlisted names');
    expect(lockOnFailure).toHaveBeenCalledOnce();
    await expect(
      performLegacyCutover(['legacy-db'], ['legacy-key'], storage, {
        dryRun: true,
      }),
    ).resolves.toEqual({
      status: 'dry-run',
      deletedDatabases: ['legacy-db'],
      deletedStorageKeys: ['legacy-key'],
    });
    expect(
      storage.values.get('budgetflow-v2-cutover-marker:default'),
    ).toBeUndefined();
    expect(storage.broadcast).not.toHaveBeenCalled();
  });

  it('refuses destructive cutover without both explicit allowlists', async () => {
    const storage = buildStorage();
    storage.values.set('legacy-sync', 'present');

    await expect(
      performLegacyCutover(['legacy-db'], ['legacy-sync'], storage),
    ).rejects.toThrow('explicit database and storage allowlists');
    expect(storage.values.get('legacy-sync')).toBe('present');
    expect(storage.broadcast).not.toHaveBeenCalled();
  });

  it('protects the active v2 database, checkpoint metadata, marker, and device identity', async () => {
    const storage = buildStorage();

    await expect(
      performLegacyCutover(
        ['budgetflow-encrypted-financial-data:user:workspace'],
        [],
        storage,
        { dryRun: true },
      ),
    ).rejects.toThrow(/protected/);
    for (const target of [
      'budget-sync-metadata:user:workspace',
      'budgetflow-v2-cutover-marker:default',
      'budgetflow:vault-v2:device-id',
    ]) {
      await expect(
        performLegacyCutover([], [target], storage, { dryRun: true }),
      ).rejects.toThrow(/protected/);
    }
  });

  it('locks on a destructive failure, leaves no marker, and permits a bounded retry', async () => {
    const values = new Map<string, string>();
    const failedStorage = {
      values,
      indexedDb: {
        deleteDatabase: vi.fn(() => {
          const request: {
            onsuccess: ((event: Event) => void) | null;
            onerror: ((event: Event) => void) | null;
            onblocked: ((event: Event) => void) | null;
          } = { onsuccess: null, onerror: null, onblocked: null };
          queueMicrotask(() => request.onerror?.(new Event('error')));
          return request;
        }),
      },
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
      broadcast: vi.fn(),
    };
    const lockOnFailure = vi.fn();

    await expect(
      performLegacyCutover(
        ['legacy-restore-a-db'],
        ['legacy-restore-a-key'],
        failedStorage,
        {
          lockOnFailure,
          allowlistedDatabaseNames: ['legacy-restore-a-db'],
          allowlistedStorageKeys: ['legacy-restore-a-key'],
        },
      ),
    ).rejects.toThrow('Legacy database deletion failed');
    expect(lockOnFailure).toHaveBeenCalledOnce();
    expect(values.get('budgetflow-v2-cutover-marker:default')).toBeUndefined();
    expect(values.get('legacy-restore-a-key')).toBeUndefined();

    const retryStorage = {
      ...failedStorage,
      indexedDb: {
        deleteDatabase: vi.fn(() => {
          const request: {
            onsuccess: ((event: Event) => void) | null;
            onerror: ((event: Event) => void) | null;
            onblocked: ((event: Event) => void) | null;
          } = { onsuccess: null, onerror: null, onblocked: null };
          queueMicrotask(() => request.onsuccess?.(new Event('success')));
          return request;
        }),
        databases: vi.fn(async () => []),
      },
    };
    values.set('legacy-restore-a-key', 'present');

    await expect(
      performLegacyCutover(
        ['legacy-restore-a-db'],
        ['legacy-restore-a-key'],
        retryStorage,
        {
          allowlistedDatabaseNames: ['legacy-restore-a-db'],
          allowlistedStorageKeys: ['legacy-restore-a-key'],
        },
      ),
    ).resolves.toMatchObject({ status: 'completed' });
    expect(values.get('legacy-restore-a-key')).toBeUndefined();
    expect(values.get('budgetflow-v2-cutover-marker:default')).toBe(
      'v2-reset-complete',
    );
  });

  it('rehearses two isolated restore inventories without sharing markers or control-plane data', async () => {
    const createRestore = () => {
      const values = new Map<string, string>([
        ['control-plane', 'preserve'],
        ['legacy-financial', 'ciphertext'],
      ]);
      return {
        values,
        indexedDb: {
          deleteDatabase: vi.fn(() => {
            const request: {
              onsuccess: ((event: Event) => void) | null;
              onerror: ((event: Event) => void) | null;
              onblocked: ((event: Event) => void) | null;
            } = { onsuccess: null, onerror: null, onblocked: null };
            queueMicrotask(() => request.onsuccess?.(new Event('success')));
            return request;
          }),
          databases: vi.fn(async () => []),
        },
        localStorage: {
          getItem: (key: string) => values.get(key) ?? null,
          setItem: (key: string, value: string) => values.set(key, value),
          removeItem: (key: string) => values.delete(key),
        },
        broadcast: vi.fn(),
      };
    };
    const restoreA = createRestore();
    const restoreB = createRestore();

    for (const restore of [restoreA, restoreB]) {
      await expect(
        performLegacyCutover(
          ['legacy-restore-db'],
          ['legacy-financial'],
          restore,
          {
            allowlistedDatabaseNames: ['legacy-restore-db'],
            allowlistedStorageKeys: ['legacy-financial'],
          },
        ),
      ).resolves.toMatchObject({ status: 'completed' });
      expect(restore.values.get('control-plane')).toBe('preserve');
      expect(restore.values.get('legacy-financial')).toBeUndefined();
      expect(restore.values.get('budgetflow-v2-cutover-marker:default')).toBe(
        'v2-reset-complete',
      );
    }
    expect(restoreA.broadcast).toHaveBeenCalledTimes(1);
    expect(restoreB.broadcast).toHaveBeenCalledTimes(1);
  });
});
