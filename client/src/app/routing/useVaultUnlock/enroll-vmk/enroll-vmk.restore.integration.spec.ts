import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSignedTrustedRequest } from '#app/routing/useVaultUnlock/create-signed-trusted-request';
import { enrollVmk } from '#app/routing/useVaultUnlock/enroll-vmk';
import { hydrateUnlockedVault } from '#app/routing/useVaultUnlock/hydrate-unlocked-vault';
import { buildRemoteFixture } from '#app/routing/useVaultUnlock/prepare-enrollment-restore/testing/build-remote-fixture';
import { useTransactionsStore } from '#model/transaction';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { encodeEnrollmentDelegation } from '#shared/adapters/vault-protocol/enrollment-transcript';
import { signEnrollmentDeviceMessage } from '#shared/adapters/vault-protocol/enrollment-transcript/sign-device-message';
import {
  restoreSignedTrustedApproval,
  type SignedTrustedResponse,
} from '#shared/adapters/vault-protocol/signed-trusted-enrollment';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { apiClient } from '#shared/api';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';
import { vaultEnrollment } from '#shared/api/vault-protocol/vault-enrollment';

const enrollment = vi.hoisted(() => ({
  prepare: vi.fn<typeof vaultEnrollment.prepare>(),
  finalize: vi.fn<typeof vaultEnrollment.finalize>(),
  confirm: vi.fn<typeof vaultEnrollment.confirm>(),
}));
vi.mock('#shared/api/vault-protocol/vault-enrollment', () => ({
  vaultEnrollment: enrollment,
}));

afterEach(() => vi.restoreAllMocks());
describe('signed enrollment financial restoration', () => {
  it('should restore financial data after a real encrypted trusted-device transfer onto a fresh replacement binding', async () => {
    const fixture = await buildRemoteFixture();
    let transferred: Uint8Array | undefined;
    try {
      vi.spyOn(apiClient, 'get').mockResolvedValue({
        status: 'available',
        snapshot: fixture.snapshot,
      });
      enrollment.prepare.mockImplementation(async (intent) => {
        if (intent.purpose !== 'trusted')
          throw new Error('Expected trusted intent');
        const createdAt = Date.now();
        return {
          serverShare: btoa(String.fromCharCode(...new Uint8Array(32).fill(3))),
          intent: {
            ...intent,
            accountId: fixture.context.accountId,
            workspaceId: fixture.context.workspaceId,
            challenge: 'A'.repeat(43),
            createdAt,
            expiresAt: createdAt + 60_000,
            deviceEnvelope: '{}',
            delegationDigest: '0'.repeat(64),
          },
        };
      });
      enrollment.finalize.mockResolvedValue(undefined);
      enrollment.confirm.mockResolvedValue(undefined);
      const replacement = crypto.randomUUID();
      const pending = await createSignedTrustedRequest(
        {
          accountId: fixture.context.accountId,
          workspaceId: fixture.context.workspaceId,
          vaultId: fixture.context.vaultId,
          keyId: fixture.context.keyId,
          oldDeviceId: fixture.context.deviceId,
          newDeviceId: replacement,
        },
        () => {},
      );
      const approver = await deviceSigningKey.generate();
      const publicKey = await deviceSigningKey.exportPublicJwk(
        approver.publicKey,
      );
      const response: SignedTrustedResponse = {
        kind: pending.request.kind,
        formatVersion: pending.request.formatVersion,
        intent: pending.request.intent,
        delegationSignature: await signEnrollmentDeviceMessage(
          approver.privateKey,
          encodeEnrollmentDelegation(pending.request.intent),
        ),
        transferResponse: await trustedDeviceEnrollment.createResponse(
          pending.request.transferRequest,
          fixture.vmk,
          approver,
          publicKey,
        ),
      };
      transferred = await restoreSignedTrustedApproval(
        response,
        pending.request,
        pending.privateKey,
        publicKey,
      );
      await enrollVmk(
        fixture.context.accountId,
        fixture.context.workspaceId,
        { ...fixture.context, status: 'available' },
        transferred,
        () => {},
        { purpose: 'trusted', pending, response },
      );
      expect(useTransactionsStore.getState().transactions).toEqual(
        fixture.payload.transactions,
      );
      expect(vaultDeviceId.get()).toBe(replacement);
      expect(
        (await fixture.database.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(false);
    } finally {
      transferred?.fill(0);
      await fixture.dispose();
    }
  });
  it.each([false, true])(
    'should restore before publishing and never replace the old active identity; recovery-on-known-profile=%s',
    async (known) => {
      const fixture = await buildRemoteFixture();
      const recoverySeed = new Uint8Array(32).fill(9);
      const statuses: string[] = [];
      const unsubscribe = encryptedPersistence.subscribe(() =>
        statuses.push(encryptedPersistence.getSnapshot().status),
      );
      try {
        vi.spyOn(apiClient, 'get').mockResolvedValue({
          status: 'available',
          snapshot: fixture.snapshot,
        });
        enrollment.prepare.mockImplementation(async (intent) => {
          if (intent.purpose === 'trusted')
            throw new Error('Unexpected trusted intent');
          const createdAt = Date.now();
          return {
            serverShare: btoa(
              String.fromCharCode(...new Uint8Array(32).fill(3)),
            ),
            intent: {
              ...intent,
              accountId: fixture.context.accountId,
              workspaceId: fixture.context.workspaceId,
              challenge: 'A'.repeat(43),
              createdAt,
              expiresAt: createdAt + 60_000,
              deviceEnvelope: '{}',
            },
          };
        });
        enrollment.finalize.mockResolvedValue(undefined);
        enrollment.confirm.mockImplementation(async () => {
          expect(encryptedPersistence.getSnapshot().status).toBe('unlocking');
          expect(await fixture.database.records.count()).toBe(0);
        });
        await enrollVmk(
          fixture.context.accountId,
          fixture.context.workspaceId,
          {
            ...fixture.context,
            status: known ? 'available' : 'enrollment-required',
          },
          fixture.vmk,
          () => {},
          { purpose: 'recovery', recoverySeed },
        );
        expect(statuses).toEqual(['unlocking', 'unlocked']);
        expect(useTransactionsStore.getState().transactions).toEqual(
          fixture.payload.transactions,
        );
        const metadata = await fixture.database.metadata.get('vault');
        expect(metadata?.requiresRemoteRestore).toBe(false);
        if (known) {
          expect(metadata?.deviceId).not.toBe(fixture.context.deviceId);
          expect(vaultDeviceId.get()).toBe(metadata?.deviceId);
        } else expect(metadata?.deviceId).toBe(fixture.context.deviceId);
        expect(persistenceSyncMetadata.get()).toMatchObject({
          observedRevision: 7,
          isDirty: false,
        });
      } finally {
        unsubscribe();
        recoverySeed.fill(0);
        await fixture.dispose();
      }
    },
  );
  it('should retry interrupted restoration on ordinary unlock without opening an empty vault', async () => {
    const fixture = await buildRemoteFixture();
    try {
      const keys = await vaultProtocol.deriveKeys(fixture.vmk, fixture.context);
      await encryptedPersistence.unlockWithVaultKeys(
        { ...keys, vmk: fixture.vmk, requiresRemoteRestore: true },
        fixture.context,
      );
      encryptedPersistence.lock();
      const read = vi
        .spyOn(apiClient, 'get')
        .mockResolvedValue({ status: 'empty' });
      await expect(
        encryptedPersistence.unlockWithVaultKeys(
          { ...keys, vmk: fixture.vmk },
          fixture.context,
          hydrateUnlockedVault,
        ),
      ).rejects.toThrow('No remote snapshot');
      expect(encryptedPersistence.getSnapshot().status).not.toBe('unlocked');
      expect(
        (await fixture.database.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(true);
      read.mockResolvedValue({
        status: 'available',
        snapshot: fixture.snapshot,
      });
      await encryptedPersistence.unlockWithVaultKeys(
        { ...keys, vmk: fixture.vmk },
        fixture.context,
        hydrateUnlockedVault,
      );
      expect(useTransactionsStore.getState().transactions).toEqual(
        fixture.payload.transactions,
      );
      expect(
        (await fixture.database.metadata.get('vault'))?.requiresRemoteRestore,
      ).toBe(false);
    } finally {
      await fixture.dispose();
    }
  });
});
