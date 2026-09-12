import type { RemoteVaultSnapshot } from '#features/user-settings/api/synchronize-vault/types';

export const mapRemoteSnapshotToEnvelope = (
  snapshot: RemoteVaultSnapshot,
): unknown => ({
  header: JSON.parse(snapshot.header),
  ciphertext: snapshot.ciphertext,
  signature: snapshot.signature,
});
