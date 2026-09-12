import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { enrollVmk } from '#app/routing/useVaultUnlock/enroll-vmk';
import { encryptedPersistence } from '#shared/adapters/persistence';
import {
  BudgetDatabase,
  getAccountDatabaseName,
  VaultV2Database,
} from '#shared/adapters/persistence/dexie';
import { createEncryptedPersistence } from '#shared/adapters/persistence/session/encrypted-persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

const boundary = vi.hoisted(() => ({
  prepare: vi.fn<typeof vaultEnrollment.prepare>(),
  finalize: vi.fn<typeof vaultEnrollment.finalize>(),
  confirm: vi.fn<typeof vaultEnrollment.confirm>(),
  unlock: vi.fn<typeof encryptedPersistence.unlockWithVaultKeys>(),
  lock: vi.fn(),
}));
vi.mock('#shared/api/vault-protocol/vault-enrollment', () => ({
  vaultEnrollment: boundary,
}));
vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: {
    unlockWithVaultKeys: boundary.unlock,
    lock: boundary.lock,
  },
}));
vi.mock('#app/providers/hydrate-financial-stores', () => ({
  hydrateFinancialStores: vi.fn(async () => undefined),
}));
vi.mock('#app/routing/useVaultUnlock/prepare-enrollment-restore', () => ({
  prepareEnrollmentRestore: vi.fn(async () => async () => undefined),
}));
vi.mock('#app/routing/useVaultUnlock/complete-enrollment-restore', () => ({
  completeEnrollmentRestore: vi.fn(async () => undefined),
}));

describe('signed enrollment with native encrypted IndexedDB initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });
  it.each([false, true])(
    'publishes unlocked only after confirmation and uses the approved replacement key; rejected=%s',
    async (rejected) => {
      const context = {
        accountId: `test-${crypto.randomUUID()}`,
        workspaceId: crypto.randomUUID(),
        vaultId: crypto.randomUUID(),
        keyId: crypto.randomUUID(),
        deviceId: crypto.randomUUID(),
      };
      const base = new BudgetDatabase(`test-${crypto.randomUUID()}`);
      const persistence = createEncryptedPersistence(base);
      const account = new BudgetDatabase(
        getAccountDatabaseName(context.accountId, context.workspaceId),
      );
      const database = new VaultV2Database(
        context.accountId,
        context.workspaceId,
        context.vaultId,
      );
      persistence.setAccountContext(context.accountId, context.workspaceId);
      const vmk = vaultProtocol.generateVmk();
      const recoverySeed = new Uint8Array(32).fill(9);
      const previousSigningKey = await deviceSigningKey.generate();
      const statuses: string[] = [];
      let unsubscribe: (() => void) | undefined;
      try {
        // Models locally persisted material left by a previous pending enrollment, not an active server binding.
        await persistence.unlockWithVaultKeys(
          {
            ...(await vaultProtocol.deriveKeys(vmk, context)),
            vmk,
            signingKeyPair: previousSigningKey,
            localShare: await vaultProtocol.generateLocalShare(),
          },
          context,
        );
        await persistence.replaceCollections([
          {
            collection: 'rules',
            records: [{ id: 'financial-fixture', value: 'synthetic-secret' }],
          },
        ]);
        await database.open();
        const records = await database.records.toArray();
        persistence.lock();
        unsubscribe = persistence.subscribe(() =>
          statuses.push(persistence.getSnapshot().status),
        );
        boundary.unlock.mockImplementation(persistence.unlockWithVaultKeys);
        boundary.lock.mockImplementation(persistence.lock);
        boundary.finalize.mockResolvedValue(undefined);
        boundary.prepare.mockImplementation(async (input) => {
          if (input.purpose === 'trusted')
            throw new Error('Unexpected trusted fixture');
          const createdAt = Date.now();
          return {
            serverShare: btoa(
              String.fromCharCode(...new Uint8Array(32).fill(3)),
            ),
            intent: {
              ...input,
              accountId: context.accountId,
              workspaceId: context.workspaceId,
              challenge: 'A'.repeat(43),
              createdAt,
              expiresAt: createdAt + 60_000,
              deviceEnvelope: '{}',
            },
          };
        });
        boundary.confirm.mockImplementation(async () => {
          expect(persistence.getSnapshot().status).toBe('unlocking');
          const metadata = await database.metadata.get('vault');
          if (metadata === undefined)
            throw new Error('Initialized metadata missing');
          expect(
            JSON.stringify(
              await deviceSigningKey.exportPublicJwk(
                metadata.signingKeyPair.publicKey,
              ),
            ),
          ).toBe(boundary.prepare.mock.calls[0]?.[0].signingPublicKey);
          expect(
            JSON.stringify(
              await deviceSigningKey.exportPublicJwk(
                metadata.signingKeyPair.publicKey,
              ),
            ),
          ).not.toBe(
            JSON.stringify(
              await deviceSigningKey.exportPublicJwk(
                previousSigningKey.publicKey,
              ),
            ),
          );
          expect(await database.records.toArray()).toEqual(records);
          if (rejected) throw new Error('Server confirmation rejected');
        });
        const operation = enrollVmk(
          context.accountId,
          context.workspaceId,
          { status: 'enrollment-required', ...context },
          vmk,
          () => {},
          { purpose: 'recovery', recoverySeed },
        );
        if (rejected) {
          await expect(operation).rejects.toThrow(
            'Server confirmation rejected',
          );
          expect(statuses).not.toContain('unlocked');
          expect(persistence.isUnlocked()).toBe(false);
        } else {
          await operation;
          expect(statuses).toEqual(['unlocking', 'unlocked']);
          expect(persistence.isUnlocked()).toBe(true);
          expect(
            JSON.stringify(
              await deviceSigningKey.exportPublicJwk(
                persistence.requireVaultSyncMaterial().verifyKey,
              ),
            ),
          ).toBe(boundary.prepare.mock.calls[0]?.[0].signingPublicKey);
        }
        expect(boundary.confirm).toHaveBeenCalledOnce();
      } finally {
        unsubscribe?.();
        persistence.lock();
        vmk.fill(0);
        recoverySeed.fill(0);
        await Promise.all([database.delete(), account.delete(), base.delete()]);
      }
    },
  );
});
