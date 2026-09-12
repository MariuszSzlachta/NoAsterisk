import type { RotationJournalDatabaseFixture } from '#shared/adapters/persistence/dexie/testing/build-rotation-journal-database/types';
import {
  VaultV2Database,
  type VaultV2Metadata,
} from '#shared/adapters/persistence/dexie/vault-v2-database/vault-v2-database';

export const buildRotationJournalDatabase =
  async (): Promise<RotationJournalDatabaseFixture> => {
    const accountId = `test-${crypto.randomUUID()}`;
    const workspaceId = crypto.randomUUID();
    const vaultId = crypto.randomUUID();
    const database = new VaultV2Database(accountId, workspaceId, vaultId);
    const signingKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign', 'verify'],
    );
    const metadata: VaultV2Metadata = {
      id: 'vault',
      protocolVersion: 2,
      accountId,
      workspaceId,
      vaultId,
      keyId: 'next-key',
      deviceId: 'test-device',
      createdAt: 1,
      signingKeyPair,
      sentinel: { header: {}, ciphertext: 'fixture-sentinel' },
      pendingRotation: {
        currentKeyId: 'current-key',
        nextKeyId: 'next-key',
        idempotencyKey: 'test-rotation',
        envelopePurpose: 'device-wrap',
        envelope: 'fixture-envelope',
        currentVmkEnvelope: { header: {}, ciphertext: 'fixture-current' },
        nextVmkEnvelope: { header: {}, ciphertext: 'fixture-next' },
      },
    };
    try {
      await database.metadata.put(metadata);
      return { database, metadata };
    } catch (error) {
      await database.delete();
      throw error;
    }
  };
