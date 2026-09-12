import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { buildRotationJournalDatabase } from '#shared/adapters/persistence/dexie/testing/build-rotation-journal-database';
import { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';

describe('VaultV2Database', () => {
  it('should retain the interrupted-restore marker after reopening without exposing another workspace', async () => {
    const fixture = await buildRotationJournalDatabase();
    const metadata = { ...fixture.metadata, requiresRemoteRestore: true };
    const reopened = new VaultV2Database(
      metadata.accountId,
      metadata.workspaceId,
      metadata.vaultId,
    );
    const foreign = new VaultV2Database(
      metadata.accountId,
      crypto.randomUUID(),
      metadata.vaultId,
    );
    try {
      await fixture.database.metadata.put(metadata);
      fixture.database.close();
      expect(
        (await reopened.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(true);
      expect(await foreign.metadata.get('vault')).toBeUndefined();
      await reopened.metadata.put({
        ...metadata,
        requiresRemoteRestore: false,
      });
      expect(
        (await reopened.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(false);
    } finally {
      reopened.close();
      foreign.close();
      await fixture.database.delete();
      await foreign.delete();
    }
  });
});
