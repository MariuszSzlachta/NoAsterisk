import type { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database/vault-v2-database';

export const clearVaultRotationJournal = async (
  database: VaultV2Database,
  idempotencyKey: string,
  assertCurrent: () => void,
): Promise<void> => {
  assertCurrent();
  await database.transaction('rw', database.metadata, async () => {
    assertCurrent();
    const metadata = await database.metadata.get('vault');
    assertCurrent();
    if (metadata?.pendingRotation?.idempotencyKey !== idempotencyKey) return;
    const { pendingRotation: _pendingRotation, ...withoutPendingRotation } =
      metadata;
    await database.metadata.put(withoutPendingRotation);
    assertCurrent();
  });
  assertCurrent();
};
