import { hydrateFinancialStores } from '#app/providers/hydrate-financial-stores';
import { completeEnrollmentRestore } from '#app/routing/useVaultUnlock/complete-enrollment-restore';
import { restoreRemoteVault } from '#features/user-settings/ui/hooks/restore-remote-vault';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { VaultV2Database } from '#shared/adapters/persistence/dexie';

export const hydrateUnlockedVault = async (
  isActive: () => boolean,
): Promise<void> => {
  const assertCurrent = (): void => {
    if (!isActive()) throw new Error('Vault initialization invalidated');
  };
  assertCurrent();
  const { context } = encryptedPersistence.requireVaultSyncMaterial();
  const database = new VaultV2Database(
    context.accountId,
    context.workspaceId,
    context.vaultId,
  );
  try {
    const metadata = await database.metadata.get('vault');
    assertCurrent();
    if (metadata?.requiresRemoteRestore === true) {
      await restoreRemoteVault();
      assertCurrent();
      await completeEnrollmentRestore(assertCurrent);
    } else {
      await hydrateFinancialStores(isActive);
    }
    assertCurrent();
  } finally {
    database.close();
  }
};
