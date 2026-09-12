import { createValidatedVaultPayload } from '#features/user-settings/model/create-validated-vault-payload';
import { serializeVaultPayload } from '#features/user-settings/model/vault-payload';
import { encryptedPersistence, persistenceSyncMetadata } from '#shared/adapters/persistence';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';
import { ApiError } from '#shared/api';
import { buildVaultRecords } from './build-vault-records';
import type { RemoteVaultSnapshot } from './types';

type VaultSyncResult =
  | { readonly status: 'saved'; readonly snapshot: RemoteVaultSnapshot }
  | { readonly status: 'noop'; readonly snapshot?: RemoteVaultSnapshot }
  | { readonly status: 'conflict'; readonly snapshot?: RemoteVaultSnapshot };

const toEnvelope = (snapshot: RemoteVaultSnapshot): unknown => ({
  header: JSON.parse(snapshot.header),
  ciphertext: snapshot.ciphertext,
  signature: snapshot.signature,
});

const toSnapshot = async (
  material: ReturnType<typeof encryptedPersistence.requireVaultSyncMaterial>,
  created: Awaited<ReturnType<typeof opaqueSyncSnapshot.create>>,
): Promise<RemoteVaultSnapshot> => ({
  vaultId: material.context.vaultId,
  keyId: material.context.keyId,
  deviceId: material.context.deviceId,
  revision: created.envelope.header.revision,
  previousEnvelopeHash: created.envelope.header.previousEnvelopeHash,
  envelopeHash: created.state.envelopeHash,
  header: JSON.stringify(created.envelope.header),
  ciphertext: created.envelope.ciphertext,
  signature: created.envelope.signature,
  signingPublicKey: JSON.stringify(
    await deviceSigningKey.exportPublicJwk(material.verifyKey),
  ),
  createdAt: created.envelope.header.createdAt,
});

const isRemoteCompatibleWithLocalHighWater = (
  remote: RemoteVaultSnapshot,
): boolean => {
  const metadata = persistenceSyncMetadata.get();
  if (
    metadata.observedRevision === undefined ||
    metadata.highWaterEnvelopeHash === undefined
  )
    return false;
  return (
    remote.revision === metadata.observedRevision &&
    remote.envelopeHash === metadata.highWaterEnvelopeHash
  );
};

const verifyRemote = async (
  remote: RemoteVaultSnapshot,
  material: ReturnType<typeof encryptedPersistence.requireVaultSyncMaterial>,
  force: boolean,
): Promise<void> => {
  let signingPublicKey: unknown;
  try {
    signingPublicKey = JSON.parse(remote.signingPublicKey);
  } catch {
    throw new Error('Invalid remote signing key');
  }
  const remoteVerifyKey = await deviceSigningKey.importPublicJwk(signingPublicKey);
  const metadata = persistenceSyncMetadata.get();
  if (!force) {
    if (!isRemoteCompatibleWithLocalHighWater(remote))
      throw new Error('Remote snapshot is newer or local high-water mark is missing');
    await opaqueSyncSnapshot.openEnvelope(
      toEnvelope(remote),
      material.context,
      material.syncKey,
      remoteVerifyKey,
      {
        revision: metadata.observedRevision ?? 0,
        envelopeHash: metadata.highWaterEnvelopeHash ?? '',
      },
    );
    return;
  }

  if (
    metadata.observedRevision !== undefined &&
    remote.revision < metadata.observedRevision
  )
    throw new Error('Remote snapshot rollback detected');

  await opaqueSyncSnapshot.openEnvelope(
    toEnvelope(remote),
    material.context,
    material.syncKey,
    remoteVerifyKey,
    {
      revision: metadata.observedRevision ?? 0,
      envelopeHash: metadata.highWaterEnvelopeHash ?? '',
    },
  );
};

export const synchronizeVault = async (
  options: { readonly force?: boolean } = {},
): Promise<VaultSyncResult> => {
  const material = encryptedPersistence.requireVaultSyncMaterial();
  const generation = encryptedPersistence.getGeneration();
  const abortController = new AbortController();
  const unsubscribe = encryptedPersistence.subscribe(() => {
    if (
      !encryptedPersistence.isUnlocked() ||
      encryptedPersistence.getGeneration() !== generation
    )
      abortController.abort();
  });
  const metadata = persistenceSyncMetadata.get();
  try {
    const response = await syncSnapshotApi.get(
      material.context.vaultId,
      abortController.signal,
    );
    const remote = response.status === 'available' ? response.snapshot : undefined;
    const force = options.force === true;

    if (remote !== undefined) {
      if (!force && !isRemoteCompatibleWithLocalHighWater(remote))
        return { status: 'conflict', snapshot: remote };
      await verifyRemote(remote, material, force);
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
    const nextSnapshot = await toSnapshot(material, created);
    try {
      const saved = await syncSnapshotApi.put(
        nextSnapshot,
        baseRevision,
        abortController.signal,
      );
      if (
        !encryptedPersistence.isUnlocked() ||
        encryptedPersistence.getGeneration() !== generation
      )
        throw new Error('Vault locked during sync');
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
    unsubscribe();
  }
};
