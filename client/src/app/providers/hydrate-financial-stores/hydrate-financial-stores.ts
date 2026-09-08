import { STUB_CATEGORIES, useCategoriesStore } from '#entities/category';
import type { CategoryInfo } from '#entities/category';
import { isCategoryInfo } from '#entities/category/is-category-info';
import { isRuleRecord } from '#features/admin-rules/model/is-rule-record';
import type { RuleRecord } from '#features/admin-rules/model/rule-record';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import { isBudgetRecord } from '#features/budgets/model/is-budget-record';
import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { isPeriodHistoryRecord } from '#features/budgets/model/is-period-history-record';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import type { StoredTransaction } from '#features/transactions/model/types';
import { isStoredTransaction } from '#features/transactions/model/is-stored-transaction';
import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const transactionRepository = encryptedPersistence.repository<StoredTransaction>(
  'transactions',
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

export const hydrateFinancialStores = async (): Promise<void> => {
  const [transactions, rules, categories, budgets, history] = await Promise.all([
    transactionRepository.getAll(),
    ruleRepository.getAll(),
    categoryRepository.getAll(),
    budgetRepository.getAll(),
    periodHistoryRepository.getAll(),
  ]);
  const hydratedCategories = categories.length > 0 ? categories : STUB_CATEGORIES;
  if (categories.length === 0) {
    await categoryRepository.replace(STUB_CATEGORIES);
  }

  useTransactionsStore.setState({ transactions });
  useRulesStore.setState({ rules });
  useBudgetsStore.setState({ budgets });
  usePeriodHistoryStore.setState({ history });
  useCategoriesStore.setState({ categories: hydratedCategories });
};
