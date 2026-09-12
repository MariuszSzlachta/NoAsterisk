import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { confirmVaultRotationBackup } from '#shared/adapters/persistence/dexie/confirm-vault-rotation-backup';
import { buildRotationJournalDatabase } from '#shared/adapters/persistence/dexie/testing/build-rotation-journal-database';

describe('rotation backup confirmation', () => {
  it('should persist confirmation without replacing the retry transcript', async () => {
    const { database, metadata } = await buildRotationJournalDatabase();
    try {
      await confirmVaultRotationBackup(
        database,
        'test-rotation',
        'next-key',
        () => undefined,
      );
      expect((await database.metadata.get('vault'))?.pendingRotation).toEqual({
        ...metadata.pendingRotation,
        recoveryBackupConfirmed: true,
      });
    } finally {
      await database.delete();
    }
  });

  it.each([
    ['other-rotation', 'next-key'],
    ['test-rotation', 'other-key'],
  ])(
    'should reject a different operation or key without changing metadata',
    async (operation, key) => {
      const { database, metadata } = await buildRotationJournalDatabase();
      try {
        await expect(
          confirmVaultRotationBackup(database, operation, key, () => undefined),
        ).rejects.toThrow();
        expect((await database.metadata.get('vault'))?.pendingRotation).toEqual(
          metadata.pendingRotation,
        );
      } finally {
        await database.delete();
      }
    },
  );

  it('should roll back confirmation when its session expires during the native write', async () => {
    const { database, metadata } = await buildRotationJournalDatabase();
    let isCurrent = true;
    database.metadata.hook('updating', () => {
      isCurrent = false;
    });
    try {
      await expect(
        confirmVaultRotationBackup(
          database,
          'test-rotation',
          'next-key',
          () => {
            if (!isCurrent) throw new Error('Session expired');
          },
        ),
      ).rejects.toThrow('Session expired');
      expect((await database.metadata.get('vault'))?.pendingRotation).toEqual(
        metadata.pendingRotation,
      );
    } finally {
      await database.delete();
    }
  });
});
