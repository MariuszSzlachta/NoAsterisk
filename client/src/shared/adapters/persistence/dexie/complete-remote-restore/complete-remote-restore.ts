import { VaultV2Database } from '#shared/adapters/persistence/dexie/vault-v2-database';

export const completeRemoteRestore = async (
  context: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  },
  assertCurrent: () => void,
): Promise<void> => {
  const database = new VaultV2Database(
    context.accountId,
    context.workspaceId,
    context.vaultId,
  );
  try {
    assertCurrent();
    await database.transaction('rw', database.metadata, async () => {
      const metadata = await database.metadata.get('vault');
      assertCurrent();
      if (
        metadata === undefined ||
        metadata.accountId !== context.accountId ||
        metadata.workspaceId !== context.workspaceId ||
        metadata.vaultId !== context.vaultId ||
        metadata.keyId !== context.keyId ||
        metadata.deviceId !== context.deviceId
      )
        throw new Error('Remote restore metadata scope changed');
      await database.metadata.put({
        ...metadata,
        requiresRemoteRestore: false,
      });
      assertCurrent();
    });
  } finally {
    database.close();
  }
};
