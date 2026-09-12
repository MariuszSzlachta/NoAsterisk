import { createVaultCollectionWrites } from '#features/user-settings/model/create-vault-collection-writes';
import { createVaultRestorePlan } from '#features/user-settings/model/create-vault-restore-plan';
import type { DecryptedVaultPayload } from '#features/user-settings/model/vault-payload';
import { VaultPayloadError } from '#features/user-settings/model/vault-payload-error';
import { captureVaultRestoreScope } from '#features/user-settings/ui/hooks/capture-vault-restore-scope';
import type {
  VaultRestoreAcknowledgement,
  VaultRestoreScope,
} from '#features/user-settings/ui/hooks/capture-vault-restore-scope/types';
import { publishRestoredVault } from '#features/user-settings/ui/hooks/publish-restored-vault';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';

export const restoreVaultPayload = async (
  payload: DecryptedVaultPayload,
  scope: VaultRestoreScope = captureVaultRestoreScope(),
  acknowledgement?: VaultRestoreAcknowledgement,
): Promise<void> => {
  const plan = createVaultRestorePlan(payload);
  if (plan === undefined) {
    throw new VaultPayloadError('Vault payload failed validation');
  }

  scope.assertCurrent();
  await encryptedPersistence.replaceCollections(
    createVaultCollectionWrites(plan.payload),
    {
      assertCurrent: scope.assertCurrent,
      // Publish and acknowledge before releasing the persistence write queue.
      publish: (committedMutationVersion): void => {
        if (
          !encryptedPersistence.isUnlocked() ||
          encryptedPersistence.getGeneration() !== scope.generation ||
          committedMutationVersion !== scope.mutationVersion + 1 ||
          persistenceSyncMetadata.get().mutationVersion !==
            committedMutationVersion
        )
          throw new Error('Vault restore publication scope changed');
        publishRestoredVault(plan.payload);
        if (
          !encryptedPersistence.isUnlocked() ||
          encryptedPersistence.getGeneration() !== scope.generation ||
          persistenceSyncMetadata.get().mutationVersion !==
            committedMutationVersion
        )
          throw new Error('Vault restore publication scope changed');
        if (acknowledgement !== undefined)
          persistenceSyncMetadata.markSynced(
            acknowledgement.revision,
            acknowledgement.createdAt,
            acknowledgement.envelopeHash,
            committedMutationVersion,
          );
      },
    },
  );
};
