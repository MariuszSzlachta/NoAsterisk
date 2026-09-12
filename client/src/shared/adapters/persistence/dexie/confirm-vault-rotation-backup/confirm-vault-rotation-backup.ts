import { createPersistenceCryptoError } from '#shared/adapters/persistence/crypto/errors';
import type { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database/vault-v2-database';

export const confirmVaultRotationBackup = async (
  database: VaultV2Database,
  idempotencyKey: string,
  nextKeyId: string,
  assertCurrent: () => void,
): Promise<void> => {
  assertCurrent();
  await database.transaction('rw', database.metadata, async () => {
    assertCurrent();
    const metadata = await database.metadata.get('vault');
    assertCurrent();
    if (
      metadata?.pendingRotation?.idempotencyKey !== idempotencyKey ||
      metadata.pendingRotation.nextKeyId !== nextKeyId
    )
      throw createPersistenceCryptoError('Pending rotation context changed');
    await database.metadata.put({
      ...metadata,
      pendingRotation: {
        ...metadata.pendingRotation,
        recoveryBackupConfirmed: true,
      },
    });
    assertCurrent();
  });
  assertCurrent();
};
