import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createVaultPayload,
  serializeVaultPayload,
} from '#features/user-settings/model/vault-payload';
import { restoreRemoteVault } from '#features/user-settings/ui/hooks/restore-remote-vault';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';
import { VaultV2Database } from '#shared/adapters/persistence/dexie';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { apiClient } from '#shared/api';

const databases: VaultV2Database[] = [];
const buildRemoteVault = async () => {
  const context = {
    accountId: `test-${crypto.randomUUID()}`,
    workspaceId: crypto.randomUUID(),
    vaultId: crypto.randomUUID(),
    keyId: crypto.randomUUID(),
    deviceId: crypto.randomUUID(),
  };
  encryptedPersistence.setAccountContext(
    context.accountId,
    context.workspaceId,
  );
  const vmk = vaultProtocol.generateVmk();
  try {
    const keys = await vaultProtocol.deriveKeys(vmk, context);
    await encryptedPersistence.unlockWithVaultKeys({ ...keys, vmk }, context);
    databases.push(
      new VaultV2Database(
        context.accountId,
        context.workspaceId,
        context.vaultId,
      ),
    );
    const material = encryptedPersistence.requireVaultSyncMaterial();
    const payload = createVaultPayload({
      transactions: [],
      rules: [],
      categories: [],
      budgets: [],
      periodHistory: [],
      importHistory: [],
    });
    const created = await opaqueSyncSnapshot.create({
      plaintext: serializeVaultPayload(payload),
      context,
      revision: 1,
      previousEnvelopeHash: '',
      signingKey: material.signingKey,
      syncKey: material.syncKey,
    });
    return {
      vaultId: context.vaultId,
      keyId: context.keyId,
      deviceId: context.deviceId,
      revision: 1,
      previousEnvelopeHash: '',
      envelopeHash: created.state.envelopeHash,
      header: JSON.stringify(created.envelope.header),
      ciphertext: created.envelope.ciphertext,
      signature: created.envelope.signature,
      signingPublicKey: JSON.stringify(
        await deviceSigningKey.exportPublicJwk(material.verifyKey),
      ),
      createdAt: created.envelope.header.createdAt,
    };
  } finally {
    vmk.fill(0);
  }
};

afterEach(async () => {
  vi.restoreAllMocks();
  encryptedPersistence.lock();
  await Promise.all(databases.splice(0).map((database) => database.delete()));
});

describe('restoreRemoteVault', () => {
  it('should decrypt and acknowledge the exact remote snapshot with real vault keys', async () => {
    const snapshot = await buildRemoteVault();
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      status: 'available',
      snapshot,
    });
    const version = persistenceSyncMetadata.get().mutationVersion;
    await restoreRemoteVault();
    expect(persistenceSyncMetadata.get()).toMatchObject({
      mutationVersion: version + 1,
      observedRevision: 1,
      highWaterEnvelopeHash: snapshot.envelopeHash,
      isDirty: false,
    });
  });
  it('should reject an empty response without changing the watermark', async () => {
    await buildRemoteVault();
    vi.spyOn(apiClient, 'get').mockResolvedValue({ status: 'empty' });
    const metadata = persistenceSyncMetadata.get();
    await expect(restoreRemoteVault()).rejects.toThrow('No remote snapshot');
    expect(persistenceSyncMetadata.get()).toEqual(metadata);
  });
  it('should reject unsigned transport revision changes before replacement', async () => {
    const snapshot = await buildRemoteVault();
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      status: 'available',
      snapshot: { ...snapshot, revision: 999 },
    });
    const metadata = persistenceSyncMetadata.get();
    await expect(restoreRemoteVault()).rejects.toThrow('metadata mismatch');
    expect(persistenceSyncMetadata.get()).toEqual(metadata);
  });
  it('should retain newer local mutations when they commit during the remote read', async () => {
    const snapshot = await buildRemoteVault();
    vi.spyOn(apiClient, 'get').mockImplementation(async () => {
      persistenceSyncMetadata.markDirty();
      return { status: 'available', snapshot };
    });
    await expect(restoreRemoteVault()).rejects.toThrow('Vault changed');
    expect(persistenceSyncMetadata.get().isDirty).toBe(true);
    expect(persistenceSyncMetadata.get().observedRevision).toBeUndefined();
  });
});
