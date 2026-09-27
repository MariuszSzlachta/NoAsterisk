import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { prepareEnrollmentRestore } from '#app/routing/useVaultUnlock/prepare-enrollment-restore';
import { buildRemoteFixture } from '#app/routing/useVaultUnlock/prepare-enrollment-restore/testing/build-remote-fixture';
import { useTransactionsStore } from '#model/transaction';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { apiClient } from '#shared/api';

afterEach(() => vi.restoreAllMocks());
describe('prepareEnrollmentRestore', () => {
  it('should reject authentic but invalid financial records before device enrollment', async () => {
    const fixture = await buildRemoteFixture(
      '{"transactions":[{"id":1}],"rules":[]}',
    );
    try {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        status: 'available',
        snapshot: fixture.snapshot,
      });
      await expect(
        prepareEnrollmentRestore(fixture.context, fixture.vmk, () => {}),
      ).rejects.toThrow();
      expect(encryptedPersistence.isUnlocked()).toBe(false);
      expect(persistenceSyncMetadata.get().observedRevision).toBeUndefined();
    } finally {
      await fixture.dispose();
    }
  });
  it('should preserve authenticated local financial records and unsynced mutations when only device credentials were lost', async () => {
    const fixture = await buildRemoteFixture();
    try {
      await encryptedPersistence.unlockWithVaultKeys(
        {
          ...(await vaultProtocol.deriveKeys(fixture.vmk, fixture.context)),
          vmk: fixture.vmk,
          requiresRemoteRestore: false,
        },
        fixture.context,
      );
      await encryptedPersistence.replaceCollections([
        { collection: 'transactions', records: fixture.payload.transactions },
      ]);
      const stored = await fixture.database.records.toArray();
      encryptedPersistence.lock();
      const read = vi.spyOn(apiClient, 'get');
      expect(
        await prepareEnrollmentRestore(fixture.context, fixture.vmk, () => {}),
      ).toBeUndefined();
      expect(read).not.toHaveBeenCalled();
      expect(await fixture.database.records.toArray()).toEqual(stored);
      expect(persistenceSyncMetadata.get().isDirty).toBe(true);
    } finally {
      await fixture.dispose();
    }
  });
  it('should restore the latest authentic snapshot on a fresh profile without writing plaintext to IndexedDB', async () => {
    const fixture = await buildRemoteFixture();
    try {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        status: 'available',
        snapshot: fixture.snapshot,
      });
      const publish = await prepareEnrollmentRestore(
        fixture.context,
        fixture.vmk,
        () => {},
      );
      if (publish === undefined)
        throw new Error('Expected fresh-profile restore');
      expect(encryptedPersistence.isUnlocked()).toBe(false);
      await encryptedPersistence.unlockWithVaultKeys(
        {
          ...(await vaultProtocol.deriveKeys(fixture.vmk, fixture.context)),
          vmk: fixture.vmk,
        },
        fixture.context,
        async () => {
          expect(encryptedPersistence.getSnapshot().status).toBe('unlocking');
          await publish();
        },
      );
      expect(useTransactionsStore.getState().transactions).toEqual(
        fixture.payload.transactions,
      );
      expect(persistenceSyncMetadata.get()).toMatchObject({
        observedRevision: 7,
        highWaterEnvelopeHash: fixture.snapshot.envelopeHash,
        isDirty: false,
      });
      const stored = await fixture.database.records.toArray();
      expect(stored.length).toBeGreaterThan(0);
      expect(JSON.stringify(stored)).not.toContain(
        'Synthetic financial transaction',
      );
      expect(JSON.stringify(stored)).not.toContain('"amount":-100');
    } finally {
      await fixture.dispose();
    }
  });
  it.each(['empty', 'tampered', 'wrong-key', 'rollback'])(
    'should fail closed for %s without publishing or acknowledging data',
    async (failure) => {
      const fixture = await buildRemoteFixture();
      const incorrectVmk = new Uint8Array(32).fill(1);
      try {
        if (failure === 'rollback')
          persistenceSyncMetadata.rememberRevision(8, 'trusted-hash');
        const metadata = persistenceSyncMetadata.get();
        vi.spyOn(apiClient, 'get').mockResolvedValue(
          failure === 'empty'
            ? { status: 'empty' }
            : {
                status: 'available',
                snapshot:
                  failure === 'tampered'
                    ? { ...fixture.snapshot, revision: 9 }
                    : fixture.snapshot,
              },
        );
        await expect(
          prepareEnrollmentRestore(
            fixture.context,
            failure === 'wrong-key' ? incorrectVmk : fixture.vmk,
            () => {},
          ),
        ).rejects.toThrow();
        expect(encryptedPersistence.isUnlocked()).toBe(false);
        expect(persistenceSyncMetadata.get()).toEqual(metadata);
        expect(await fixture.database.records.count()).toBe(0);
      } finally {
        incorrectVmk.fill(0);
        await fixture.dispose();
      }
    },
  );
  it('should reject a prepared restore when local mutations change before publication', async () => {
    const fixture = await buildRemoteFixture();
    try {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        status: 'available',
        snapshot: fixture.snapshot,
      });
      const publish = await prepareEnrollmentRestore(
        fixture.context,
        fixture.vmk,
        () => {},
      );
      if (publish === undefined)
        throw new Error('Expected fresh-profile restore');
      persistenceSyncMetadata.markDirty();
      await expect(publish()).rejects.toThrow('Vault changed');
      expect(persistenceSyncMetadata.get().observedRevision).toBeUndefined();
    } finally {
      await fixture.dispose();
    }
  });
});
