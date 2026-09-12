import { describe, expect, it } from 'vitest';

import { createVaultPayload } from '#features/user-settings/model/vault-payload';
import { publishRestoredVault } from '#features/user-settings/ui/hooks/publish-restored-vault';
import { useBudgetsStore, usePeriodHistoryStore } from '#entities/budget';
import { useCategoriesStore } from '#entities/category';
import { useImportHistoryStore } from '#entities/import-batch';
import { useRulesStore } from '#entities/rule';
import { useTransactionsStore } from '#entities/transaction';

describe('publishRestoredVault', () => {
  it('should clear every in-memory collection when the restored complete vault is empty', () => {
    const payload = createVaultPayload({
      transactions: [],
      rules: [],
      categories: [],
      budgets: [],
      periodHistory: [],
      importHistory: [],
    });
    publishRestoredVault(payload);
    expect(useTransactionsStore.getState().transactions).toEqual([]);
    expect(useRulesStore.getState().rules).toEqual([]);
    expect(useCategoriesStore.getState().categories).toEqual([]);
    expect(useBudgetsStore.getState().budgets).toEqual([]);
    expect(usePeriodHistoryStore.getState().history).toEqual([]);
    expect(useImportHistoryStore.getState().history).toEqual([]);
  });
});
