import { isRemoteAtHighWater } from '#features/user-settings/api/synchronize-vault/is-remote-at-high-water';
import { mapRemoteSnapshotToEnvelope } from '#features/user-settings/api/synchronize-vault/map-remote-snapshot-to-envelope';
import type {
  RemoteVaultSnapshot,
  VaultSyncHighWater,
} from '#features/user-settings/api/synchronize-vault/types';
import type { encryptedPersistence } from '#shared/adapters/persistence';
import { assertSnapshotBinding } from '#shared/adapters/vault-protocol/assert-snapshot-binding';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';

export const verifyRemoteSnapshot = async (
  remote: RemoteVaultSnapshot,
  material: ReturnType<typeof encryptedPersistence.requireVaultSyncMaterial>,
  shouldForce: boolean,
  metadata: VaultSyncHighWater,
  assertCurrent: () => void,
): Promise<void> => {
  let signingPublicKey: unknown;
  try {
    signingPublicKey = JSON.parse(remote.signingPublicKey);
  } catch {
    throw new Error('Invalid remote signing key');
  }
  const remoteVerifyKey =
    await deviceSigningKey.importPublicJwk(signingPublicKey);
  assertCurrent();
  await assertSnapshotBinding(mapRemoteSnapshotToEnvelope(remote), remote);
  assertCurrent();
  if (!shouldForce && !isRemoteAtHighWater(remote, metadata))
    throw new Error(
      'Remote snapshot is newer or local high-water mark is missing',
    );

  if (
    metadata.observedRevision !== undefined &&
    remote.revision < metadata.observedRevision
  )
    throw new Error('Remote snapshot rollback detected');

  await opaqueSyncSnapshot.openEnvelope(
    mapRemoteSnapshotToEnvelope(remote),
    material.context,
    material.syncKey,
    remoteVerifyKey,
    {
      revision: metadata.observedRevision ?? 0,
      envelopeHash: metadata.highWaterEnvelopeHash ?? '',
    },
  );
  assertCurrent();
};
