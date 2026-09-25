import { VaultV2Database } from '#shared/adapters/persistence/dexie';
import type { VaultV2Metadata } from '#shared/adapters/persistence/dexie/vault-v2-database/types';
import type { EncryptedPersistence } from '#shared/adapters/persistence/session/session-types';

type VaultContext = Parameters<EncryptedPersistence['readVaultLocalShare']>[0];

const matchesContext = (
  metadata: VaultV2Metadata | undefined,
  context: VaultContext,
  allowPendingRotation: boolean,
): boolean => {
  const contextMatchesPendingRotation =
    allowPendingRotation &&
    metadata?.pendingRotation?.currentKeyId === context.keyId &&
    metadata.keyId === metadata.pendingRotation.nextKeyId;
  return (
    metadata !== undefined &&
    metadata.accountId === context.accountId &&
    metadata.workspaceId === context.workspaceId &&
    metadata.vaultId === context.vaultId &&
    (metadata.keyId === context.keyId || contextMatchesPendingRotation) &&
    metadata.deviceId === context.deviceId
  );
};

export const createVaultLocalShareStore = () => ({
  read: async (context: VaultContext): Promise<CryptoKey | undefined> => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    await database.open();
    try {
      const metadata = await database.metadata.get('vault');
      return matchesContext(metadata, context, true)
        ? metadata?.localShare
        : undefined;
    } finally {
      database.close();
    }
  },
  remove: async (context: VaultContext): Promise<void> => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    await database.open();
    try {
      const metadata = await database.metadata.get('vault');
      if (!matchesContext(metadata, context, false) || metadata === undefined)
        return;
      const { localShare: _localShare, ...withoutLocalShare } = metadata;
      await database.metadata.put(withoutLocalShare);
    } finally {
      database.close();
    }
  },
  store: async (
    context: VaultContext,
    localShare: CryptoKey,
  ): Promise<void> => {
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    await database.open();
    try {
      const metadata = await database.metadata.get('vault');
      if (!matchesContext(metadata, context, false) || metadata === undefined)
        throw new Error('Vault metadata context mismatch');
      await database.metadata.put({ ...metadata, localShare });
    } finally {
      database.close();
    }
  },
});
