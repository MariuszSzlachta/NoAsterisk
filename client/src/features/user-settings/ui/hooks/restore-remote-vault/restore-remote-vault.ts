import { VAULT_NETWORK_TIMEOUT_MS } from '#features/user-settings/api/constants/vault-network-timeout';
import { parseVaultPayload } from '#features/user-settings/model/parse-vault-payload';
import { captureVaultRestoreScope } from '#features/user-settings/ui/hooks/capture-vault-restore-scope';
import { restoreVaultPayload } from '#features/user-settings/ui/hooks/restore-vault-payload';
import { vaultOperationQueue } from '#model/vault/lib/vault-operation-queue';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';
import { createVaultAbortScope } from '#shared/adapters/persistence/session/create-vault-abort-scope';
import { assertSnapshotBinding } from '#shared/adapters/vault-protocol/assert-snapshot-binding';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import { opaqueSyncSnapshot } from '#shared/adapters/vault-protocol/opaque-sync-snapshot';
import { syncSnapshotApi } from '#shared/api/vault-protocol/sync-snapshot-api';

export const restoreRemoteVault = async (): Promise<void> => {
  const restoreScope = captureVaultRestoreScope();
  return vaultOperationQueue(async () => {
    restoreScope.assertCurrent();
    const networkScope = createVaultAbortScope(
      encryptedPersistence,
      VAULT_NETWORK_TIMEOUT_MS,
    );
    try {
      const material = encryptedPersistence.requireVaultSyncMaterial();
      const response = await syncSnapshotApi.get(
        material.context.vaultId,
        networkScope.signal,
      );
      networkScope.assertCurrent();
      restoreScope.assertCurrent();
      if (response.status !== 'available' || response.snapshot === undefined)
        throw new Error('No remote snapshot');
      const snapshot = response.snapshot;
      const envelope = {
        header: JSON.parse(snapshot.header),
        ciphertext: snapshot.ciphertext,
        signature: snapshot.signature,
      };
      await assertSnapshotBinding(envelope, snapshot);
      const senderKey = await deviceSigningKey.importPublicJwk(
        JSON.parse(snapshot.signingPublicKey),
      );
      const metadata = persistenceSyncMetadata.get();
      const plaintext = await opaqueSyncSnapshot.openEnvelope(
        envelope,
        material.context,
        material.syncKey,
        senderKey,
        {
          revision: metadata.observedRevision ?? 0,
          envelopeHash: metadata.highWaterEnvelopeHash,
        },
      );
      networkScope.assertCurrent();
      restoreScope.assertCurrent();
      await restoreVaultPayload(parseVaultPayload(plaintext), restoreScope, {
        revision: snapshot.revision,
        createdAt: snapshot.createdAt,
        envelopeHash: snapshot.envelopeHash,
      });
    } finally {
      networkScope.dispose();
    }
  });
};
