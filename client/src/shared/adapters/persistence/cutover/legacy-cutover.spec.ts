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
    );

    expect(result.status).toBe('completed');
    expect(storage.values.get('legacy-sync')).toBeUndefined();
    expect(storage.values.get('budgetflow-v2-cutover-marker:default')).toBe(
      'v2-reset-complete',
    );
    expect(storage.broadcast).toHaveBeenCalledWith({ type: 'database-deleting' });
    expect(await indexedDB.databases()).not.toContainEqual(
      expect.objectContaining({ name: databaseName }),
    );
  });

  it('is idempotent and does not touch unrelated storage', async () => {
    const storage = buildStorage();
    storage.values.set('unrelated', 'keep');
    storage.values.set('budgetflow-v2-cutover-marker:default', 'v2-reset-complete');

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
      performLegacyCutover(['legacy-db'], ['legacy-key'], storage, { dryRun: true }),
    ).resolves.toEqual({
      status: 'dry-run',
      deletedDatabases: ['legacy-db'],
      deletedStorageKeys: ['legacy-key'],
    });
    expect(storage.values.get('budgetflow-v2-cutover-marker:default')).toBeUndefined();
    expect(storage.broadcast).not.toHaveBeenCalled();
  });

  it('locks on a destructive failure, leaves no marker, and permits a bounded retry', async () => {
    const values = new Map<string, string>();
    const failedStorage = {
      values,
      indexedDb: {
        deleteDatabase: vi.fn(() => {
          const request: {
            onsuccess?: () => void;
            onerror?: () => void;
            onblocked?: () => void;
          } = {};
          queueMicrotask(() => request.onerror?.());
          return request as IDBOpenDBRequest;
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
      performLegacyCutover(['legacy-restore-a-db'], ['legacy-restore-a-key'], failedStorage, {
        lockOnFailure,
      }),
    ).rejects.toThrow('Legacy database deletion failed');
    expect(lockOnFailure).toHaveBeenCalledOnce();
    expect(values.get('budgetflow-v2-cutover-marker:default')).toBeUndefined();
    expect(values.get('legacy-restore-a-key')).toBeUndefined();

    const retryStorage = {
      ...failedStorage,
      indexedDb: {
        deleteDatabase: vi.fn(() => {
          const request: {
            onsuccess?: () => void;
            onerror?: () => void;
            onblocked?: () => void;
          } = {};
          queueMicrotask(() => request.onsuccess?.());
          return request as IDBOpenDBRequest;
        }),
        databases: vi.fn(async () => []),
      },
    };
    values.set('legacy-restore-a-key', 'present');

    await expect(
      performLegacyCutover(['legacy-restore-a-db'], ['legacy-restore-a-key'], retryStorage),
    ).resolves.toMatchObject({ status: 'completed' });
    expect(values.get('legacy-restore-a-key')).toBeUndefined();
    expect(values.get('budgetflow-v2-cutover-marker:default')).toBe('v2-reset-complete');
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
            const request: { onsuccess?: () => void } = {};
            queueMicrotask(() => request.onsuccess?.());
            return request as IDBOpenDBRequest;
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
        performLegacyCutover(['legacy-restore-db'], ['legacy-financial'], restore),
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
