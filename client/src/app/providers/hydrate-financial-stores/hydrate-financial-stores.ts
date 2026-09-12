import { isRuleRecord } from '#features/admin-rules/model/is-rule-record';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import { isBudgetRecord } from '#features/budgets/model/is-budget-record';
import { isPeriodHistoryRecord } from '#features/budgets/model/is-period-history-record';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import {
  isImportHistoryRecord,
  useImportHistoryStore,
  type ImportHistoryRecord,
} from '#features/csv-import';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import type { StoredTransaction } from '#features/transactions/model/types';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import {
  STUB_CATEGORIES,
  useCategoriesStore,
  type CategoryInfo,
} from '#entities/category';
import { isCategoryInfo } from '#entities/category/is-category-info';
import { encryptedPersistence } from '#shared/adapters/persistence/session';
import {
  IMPORT_HISTORY_COLLECTION,
  TRANSACTIONS_COLLECTION,
} from '#shared/adapters/persistence/ports';

export const hydrateFinancialStores = async (
  isActive: () => boolean = () => encryptedPersistence.isUnlocked(),
): Promise<void> => {
  const transactionRepository = encryptedPersistence.repository<StoredTransaction>(
    TRANSACTIONS_COLLECTION,
    isStoredTransaction,
    (record) => record.id,
  );
  const ruleRepository = encryptedPersistence.repository<RuleRecord>(
    'rules',
    isRuleRecord,
    (record) => record.id,
  );
  const categoryRepository = encryptedPersistence.repository<CategoryInfo>(
    'categories',
    isCategoryInfo,
    (record) => record.id,
  );
  const budgetRepository = encryptedPersistence.repository<BudgetRecord>(
    'budgets',
    isBudgetRecord,
    (record) => record.id,
  );
  const periodHistoryRepository = encryptedPersistence.repository<PeriodHistoryRecord>(
    'period-history',
    isPeriodHistoryRecord,
    (record) => record.id,
  );
  const importHistoryRepository = encryptedPersistence.repository<ImportHistoryRecord>(
    IMPORT_HISTORY_COLLECTION,
    isImportHistoryRecord,
    (record) => record.batchId,
  );
  const [transactions, rules, categories, budgets, history, importHistory] =
    await Promise.all([
      transactionRepository.getAll(),
      ruleRepository.getAll(),
      categoryRepository.getAll(),
      budgetRepository.getAll(),
      periodHistoryRepository.getAll(),
      importHistoryRepository.getAll(),
    ]);
  if (!isActive()) throw new Error('Vault session is locked');
  const hydratedCategories =
    categories.length > 0 ? categories : STUB_CATEGORIES;
  if (categories.length === 0) {
    if (!isActive()) throw new Error('Vault session is locked');
    await categoryRepository.replace(STUB_CATEGORIES);
  }

  if (!isActive()) throw new Error('Vault session is locked');

  useTransactionsStore.setState({ transactions });
  useRulesStore.setState({ rules });
  useBudgetsStore.setState({ budgets });
  usePeriodHistoryStore.setState({ history });
  useImportHistoryStore.getState().setHistory(importHistory);
  useCategoriesStore.setState({ categories: hydratedCategories });
};
