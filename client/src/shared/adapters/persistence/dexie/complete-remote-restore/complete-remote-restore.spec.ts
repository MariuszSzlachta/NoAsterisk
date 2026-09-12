import 'fake-indexeddb/auto';

import { describe, expect, it } from 'vitest';

import { VaultV2Database } from '#shared/adapters/persistence/dexie';
import { completeRemoteRestore } from '#shared/adapters/persistence/dexie/complete-remote-restore';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';

describe('completeRemoteRestore', () => {
  it('should clear only the matching metadata and roll back an invalidated completion', async () => {
    const context = {
      accountId: `test-${crypto.randomUUID()}`,
      workspaceId: crypto.randomUUID(),
      vaultId: crypto.randomUUID(),
      keyId: crypto.randomUUID(),
      deviceId: crypto.randomUUID(),
    };
    const database = new VaultV2Database(
      context.accountId,
      context.workspaceId,
      context.vaultId,
    );
    try {
      await database.metadata.put({
        id: 'vault',
        protocolVersion: 2,
        ...context,
        createdAt: Date.now(),
        signingKeyPair: await deviceSigningKey.generate(),
        sentinel: { header: {}, ciphertext: 'synthetic' },
        requiresRemoteRestore: true,
      });
      await expect(
        completeRemoteRestore(
          { ...context, deviceId: crypto.randomUUID() },
          () => {},
        ),
      ).rejects.toThrow('scope changed');
      let checks = 0;
      await expect(
        completeRemoteRestore(context, () => {
          checks += 1;
          if (checks === 3) throw new Error('Cancelled');
        }),
      ).rejects.toThrow('Cancelled');
      expect(
        (await database.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(true);
      await completeRemoteRestore(context, () => {});
      expect(
        (await database.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(false);
    } finally {
      await database.delete();
    }
  });
});
