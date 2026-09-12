import { encryptedPersistence } from '#shared/adapters/persistence';
import { completeRemoteRestore } from '#shared/adapters/persistence/dexie/complete-remote-restore';

export const completeEnrollmentRestore = async (
  assertCurrent: () => void,
): Promise<void> => {
  assertCurrent();
  const material = encryptedPersistence.requireVaultSyncMaterial();
  await completeRemoteRestore(material.context, assertCurrent);
  assertCurrent();
};
