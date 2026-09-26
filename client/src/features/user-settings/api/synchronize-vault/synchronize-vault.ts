import { VAULT_NETWORK_TIMEOUT_MS } from '#features/user-settings/api/constants/vault-network-timeout';
import { isRemoteAtHighWater } from '#features/user-settings/api/synchronize-vault/is-remote-at-high-water';
import { mapCreatedSnapshot } from '#features/user-settings/api/synchronize-vault/map-created-snapshot';
import type {
  VaultSyncOptions,
  VaultSyncResult,
} from '#features/user-settings/api/synchronize-vault/types';
import { verifyRemoteSnapshot } from '#features/user-settings/api/synchronize-vault/verify-remote-snapshot';
import { createValidatedVaultPayload } from '#features/user-settings/model/create-validated-vault-payload';
import { buildVaultRecords } from '#features/user-settings/model/build-vault-records';
import { serializeVaultPayload } from '#features/user-settings/model/vault-payload';
import { vaultOperationQueue } from '#entities/vault/lib/vault-operation-queue';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';
import { assertVaultSessionCurrent } from '#shared/adapters/persistence/session/assert-vault-session-current';
import { createVaultAbortScope } from '#shared/adapters/persistence/session/create-vault-abort-scope';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { ApiError } from '#shared/api';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';

export const synchronizeVault = async (
  options: VaultSyncOptions = {},
): Promise<VaultSyncResult> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  return vaultOperationQueue(async (): Promise<VaultSyncResult> => {
    assertVaultSessionCurrent(
      encryptedPersistence,
      generation,
      material.context,
    );
    const scope = createVaultAbortScope(
      encryptedPersistence,
      VAULT_NETWORK_TIMEOUT_MS,
    );
    const metadata = persistenceSyncMetadata.get();
    try {
      const response = await syncSnapshotApi.get(
        material.context.vaultId,
        scope.signal,
      );
      scope.assertCurrent();
      const remote =
        response.status === 'available' ? response.snapshot : undefined;
      const force = options.force === true;

      if (remote !== undefined) {
        if (!force && !isRemoteAtHighWater(remote, metadata))
          return { status: 'conflict', snapshot: remote };
        await verifyRemoteSnapshot(
          remote,
          material,
          force,
          metadata,
          scope.assertCurrent,
        );
      }

      if (!metadata.isDirty)
        return {
          status: 'noop',
          ...(remote === undefined ? {} : { snapshot: remote }),
        };

      const baseRevision = remote?.revision ?? metadata.observedRevision ?? 0;
      const previousEnvelopeHash =
        remote?.envelopeHash ?? metadata.highWaterEnvelopeHash ?? '';
      if (baseRevision > 0 && previousEnvelopeHash.length === 0)
        throw new Error('Sync high-water mark is missing');

      const payload = createValidatedVaultPayload(buildVaultRecords());
      const coveredMutationVersion =
        persistenceSyncMetadata.get().mutationVersion;
      const created = await opaqueSyncSnapshot.create({
        plaintext: serializeVaultPayload(payload),
        context: material.context,
        revision: baseRevision + 1,
        previousEnvelopeHash,
        signingKey: material.signingKey,
        syncKey: material.syncKey,
      });
      scope.assertCurrent();
      const nextSnapshot = await mapCreatedSnapshot(material, created);
      scope.assertCurrent();
      assertVaultSessionCurrent(
        encryptedPersistence,
        generation,
        material.context,
      );
      try {
        const saved = await syncSnapshotApi.put(
          nextSnapshot,
          baseRevision,
          scope.signal,
        );
        scope.assertCurrent();
        if (
          saved.revision !== nextSnapshot.revision ||
          saved.envelopeHash !== nextSnapshot.envelopeHash
        )
          throw new Error(
            'Sync acknowledgement does not match the uploaded snapshot',
          );
        assertVaultSessionCurrent(
          encryptedPersistence,
          generation,
          material.context,
        );
        persistenceSyncMetadata.markSynced(
          saved.revision,
          nextSnapshot.createdAt,
          saved.envelopeHash,
          coveredMutationVersion,
        );
        return { status: 'saved', snapshot: nextSnapshot };
      } catch (error) {
        if (error instanceof ApiError && error.status === 409)
          return { status: 'conflict', snapshot: remote };
        throw error;
      }
    } finally {
      scope.dispose();
    }
  });
};
