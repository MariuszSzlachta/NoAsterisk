import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { clearVaultRotationJournal } from '#shared/adapters/persistence/dexie/clear-vault-rotation-journal';
import { buildRotationJournalDatabase } from '#shared/adapters/persistence/dexie/testing/build-rotation-journal-database';

describe('rotation journal cleanup', () => {
  it('should remove only the matching journal and preserve concurrent metadata writes', async () => {
    const { database, metadata } = await buildRotationJournalDatabase();
    try {
      await Promise.all([
        clearVaultRotationJournal(database, 'test-rotation', () => undefined),
        database.metadata.update('vault', { createdAt: 2 }),
      ]);
      const restored = await database.metadata.get('vault');
      expect(restored?.pendingRotation).toBeUndefined();
      expect(restored?.sentinel).toEqual(metadata.sentinel);
      expect(restored?.createdAt).toBe(2);
    } finally {
      await database.delete();
    }
  });

  it('should preserve a journal belonging to a different operation', async () => {
    const { database, metadata } = await buildRotationJournalDatabase();
    try {
      await clearVaultRotationJournal(
        database,
        'other-rotation',
        () => undefined,
      );
      expect((await database.metadata.get('vault'))?.pendingRotation).toEqual(
        metadata.pendingRotation,
      );
    } finally {
      await database.delete();
    }
  });

  it('should roll back cleanup when its session expires during the native write', async () => {
    const { database, metadata } = await buildRotationJournalDatabase();
    let isCurrent = true;
    database.metadata.hook('updating', () => {
      isCurrent = false;
    });
    try {
      await expect(
        clearVaultRotationJournal(database, 'test-rotation', () => {
          if (!isCurrent) throw new Error('Session expired');
        }),
      ).rejects.toThrow('Session expired');
      expect((await database.metadata.get('vault'))?.pendingRotation).toEqual(
        metadata.pendingRotation,
      );
    } finally {
      await database.delete();
    }
  });
});
