import type {
  RemoteVaultSnapshot,
  VaultSyncHighWater,
} from '#features/user-settings/api/synchronize-vault/types';

export const isRemoteAtHighWater = (
  remote: RemoteVaultSnapshot,
  metadata: VaultSyncHighWater,
): boolean => {
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
