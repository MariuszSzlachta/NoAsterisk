import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import {
  BudgetDatabase,
  VaultV2Database,
} from '#shared/adapters/persistence/dexie';
import { IMPORT_HISTORY_COLLECTION } from '#shared/adapters/persistence/ports';
import { createEncryptedPersistence } from '#shared/adapters/persistence/session/encrypted-persistence/encrypted-persistence';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

const cleanup: Array<() => Promise<void>> = [];
const buildUnlockedVault = async () => {
  const context = {
    accountId: `test-${crypto.randomUUID()}`,
    workspaceId: crypto.randomUUID(),
    vaultId: crypto.randomUUID(),
    keyId: crypto.randomUUID(),
    deviceId: crypto.randomUUID(),
  };
  const persistence = createEncryptedPersistence(
    new BudgetDatabase(`test-${crypto.randomUUID()}`),
  );
  persistence.setAccountContext(context.accountId, context.workspaceId);
  const vmk = vaultProtocol.generateVmk();
  const keys = await vaultProtocol.deriveKeys(vmk, context);
  await persistence.unlockWithVaultKeys({ ...keys, vmk }, context);
  const database = new VaultV2Database(
    context.accountId,
    context.workspaceId,
    context.vaultId,
  );
  cleanup.push(async () => {
    vmk.fill(0);
    persistence.lock();
    await database.delete();
  });
  return { persistence, context, database, vmk };
};

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(cleanup.splice(0).map((dispose) => dispose()));
});

describe('encrypted persistence publication', () => {
  it('should publish the replacement before releasing queued local mutations', async () => {
    const { persistence } = await buildUnlockedVault();
    let covered: number | undefined;
    const replacement = persistence.replaceCollections(
      [{ collection: 'rules', records: [] }],
      {
        assertCurrent: () => undefined,
        publish: (version) => {
          covered = version;
          persistenceSyncMetadata.markSynced(1, '2026-09-12', 'hash', version);
        },
      },
    );
    const later = persistence.replaceCollections([
      { collection: 'rules', records: [] },
    ]);
    await replacement;
    await later;
    expect(covered).toBeDefined();
    expect(persistenceSyncMetadata.get()).toMatchObject({
      isDirty: true,
      mutationVersion: (covered ?? 0) + 1,
    });
  });

  it('should advance the v2 mutation watermark once for a related write', async () => {
    const { persistence } = await buildUnlockedVault();
    const before = persistenceSyncMetadata.get().mutationVersion;
    await persistence.putManyIfAbsentWithRelated(
      {
        collection: 'rules',
        records: [{ id: 'rule-once' }],
        validator: (value: unknown): value is { readonly id: string } =>
          typeof value === 'object' &&
          value !== null &&
          'id' in value &&
          typeof value.id === 'string',
        getId: (record): string => record.id,
        getDuplicateKey: (record): string => record.id,
      },
      () => ({
        collection: IMPORT_HISTORY_COLLECTION,
        records: [],
        getId: (): string => 'unused',
      }),
    );
    expect(persistenceSyncMetadata.get().mutationVersion).toBe(before + 1);
  });

  it('should abort before destructive writes when its publication scope expires during encryption', async () => {
    const { persistence, database } = await buildUnlockedVault();
    let valid = true;
    const original = vaultProtocol.encryptRecord;
    vi.spyOn(vaultProtocol, 'encryptRecord').mockImplementationOnce(
      async (...args) => {
        valid = false;
        return original(...args);
      },
    );
    await expect(
      persistence.replaceCollections(
        [{ collection: 'rules', records: [{ id: 'new', value: 'secret' }] }],
        {
          assertCurrent: () => {
            if (!valid) throw new Error('cancelled');
          },
          publish: () => {
            throw new Error('must not publish');
          },
        },
      ),
    ).rejects.toThrow('cancelled');
    await database.open();
    expect(await database.records.count()).toBe(0);
    database.close();
  });

  it('should verify the old recovery root against the next sentinel in a pending rotation', async () => {
    const { persistence, context, vmk } = await buildUnlockedVault();
    const nextVmk = vaultProtocol.generateVmk();
    try {
      const nextContext = { ...context, keyId: crypto.randomUUID() };
      const keys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
      await persistence.rotateVaultKeys(
        { ...keys, localShare: null },
        nextContext,
        {
          nextVmk,
          idempotencyKey: 'pending-test',
          envelopePurpose: 'device-wrap',
          envelope: 'opaque',
          recoveryBackupConfirmed: true,
        },
      );
      await expect(
        persistence.verifyVaultVmk(vmk, context),
      ).resolves.toBeUndefined();
      await expect(
        persistence.verifyVaultVmk(vaultProtocol.generateVmk(), context),
      ).rejects.toThrow();
    } finally {
      nextVmk.fill(0);
    }
  });

  it('should mark only the matching legacy journal after its backup is confirmed', async () => {
    const { persistence, context, database } = await buildUnlockedVault();
    const nextVmk = vaultProtocol.generateVmk();
    try {
      const nextContext = { ...context, keyId: crypto.randomUUID() };
      const keys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
      await persistence.rotateVaultKeys(
        { ...keys, localShare: null },
        nextContext,
        {
          nextVmk,
          idempotencyKey: 'matching',
          envelopePurpose: 'device-wrap',
          envelope: 'opaque',
          recoveryBackupConfirmed: true,
        },
      );
      await database.open();
      const metadata = await database.metadata.get('vault');
      if (metadata?.pendingRotation === undefined)
        throw new Error('Expected rotation fixture');
      const { recoveryBackupConfirmed: _confirmed, ...legacy } =
        metadata.pendingRotation;
      await database.metadata.put({ ...metadata, pendingRotation: legacy });
      await expect(
        persistence.confirmPendingVaultRotationBackup('wrong'),
      ).rejects.toThrow('context changed');
      await persistence.confirmPendingVaultRotationBackup('matching');
      expect(
        (await persistence.getPendingVaultRotation())?.recoveryBackupConfirmed,
      ).toBe(true);
      database.close();
    } finally {
      nextVmk.fill(0);
    }
  });
});
