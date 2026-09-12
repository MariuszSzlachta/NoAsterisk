import { useEffect, useSyncExternalStore } from 'react';

import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';
import { persistenceSyncMetadata } from '#shared/adapters/persistence';
import { synchronizeVault } from '#features/user-settings/api/synchronize-vault';

const AUTO_SYNC_DEBOUNCE_MS = 750;

export const useVaultAutomaticSync = (enabled: boolean): void => {
  const transactions = useTransactionsStore((state) => state.transactions);
  const rules = useRulesStore((state) => state.rules);
  const categories = useCategoriesStore((state) => state.categories);
  const budgets = useBudgetsStore((state) => state.budgets);
  const periodHistory = usePeriodHistoryStore((state) => state.history);
  const importHistory = useImportHistoryStore((state) => state.history);
  const syncMetadata = useSyncExternalStore(
    persistenceSyncMetadata.subscribe,
    persistenceSyncMetadata.get,
    persistenceSyncMetadata.get,
  );

  useEffect(() => {
    if (!enabled || !syncMetadata.isDirty) return;
    const timeout = window.setTimeout(() => {
      void synchronizeVault().catch(() => {
        // The dirty marker is intentionally retained. The next local change,
        // retry or explicit settings action can safely attempt the same CAS.
      });
    }, AUTO_SYNC_DEBOUNCE_MS);
    return () => window.clearTimeout(timeout);
  }, [
    enabled,
    syncMetadata.isDirty,
    transactions,
    rules,
    categories,
    budgets,
    periodHistory,
    importHistory,
  ]);
};
