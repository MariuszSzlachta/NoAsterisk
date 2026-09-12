import type { VaultRestoreScope } from '#features/user-settings/ui/hooks/capture-vault-restore-scope/types';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import {
  encryptedPersistence,
  persistenceSyncMetadata,
} from '#shared/adapters/persistence';

export const captureVaultRestoreScope = (): VaultRestoreScope => {
  const generation = encryptedPersistence.getGeneration();
  const mutationVersion = persistenceSyncMetadata.get().mutationVersion;
  const observedRevision = persistenceSyncMetadata.get().observedRevision;
  const envelopeHash = persistenceSyncMetadata.get().highWaterEnvelopeHash;
  const transactions = useTransactionsStore.getState().transactions;
  const rules = useRulesStore.getState().rules;
  const categories = useCategoriesStore.getState().categories;
  const budgets = useBudgetsStore.getState().budgets;
  const history = usePeriodHistoryStore.getState().history;
  const imports = useImportHistoryStore.getState().history;
  return {
    generation,
    mutationVersion,
    assertCurrent: (): void => {
      if (
        !encryptedPersistence.isUnlocked() ||
        encryptedPersistence.getGeneration() !== generation ||
        persistenceSyncMetadata.get().mutationVersion !== mutationVersion ||
        persistenceSyncMetadata.get().observedRevision !== observedRevision ||
        persistenceSyncMetadata.get().highWaterEnvelopeHash !== envelopeHash ||
        useTransactionsStore.getState().transactions !== transactions ||
        useRulesStore.getState().rules !== rules ||
        useCategoriesStore.getState().categories !== categories ||
        useBudgetsStore.getState().budgets !== budgets ||
        usePeriodHistoryStore.getState().history !== history ||
        useImportHistoryStore.getState().history !== imports
      )
        throw new Error('Vault changed while preparing restore');
    },
  };
};
