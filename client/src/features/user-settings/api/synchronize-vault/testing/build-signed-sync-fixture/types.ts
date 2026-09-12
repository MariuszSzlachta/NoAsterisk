import type { RemoteVaultSnapshot } from '#features/user-settings/api/synchronize-vault/types';
import type { encryptedPersistence } from '#shared/adapters/persistence';
import type { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';

export interface SignedSyncFixture {
  readonly vmk: Uint8Array;
  readonly material: ReturnType<
    typeof encryptedPersistence.requireVaultSyncMaterial
  >;
  readonly created: Awaited<ReturnType<typeof opaqueSyncSnapshot.create>>;
  readonly snapshot: RemoteVaultSnapshot;
}
