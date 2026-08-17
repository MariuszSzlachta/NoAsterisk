import type { DateRange } from 'react-day-picker';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
// ARCH-EXCEPTION: cross-feature import — budgets needs transaction data for spent computation.
// Transactions feature exports useTransactionsStore via its public API (index.ts).
import { useTransactionsStore } from '#features/transactions';

import { mapBudgetRecordToViewModel, getPeriodRange } from '#features/budgets/model/transformers';
import type { BudgetFilterTab, BudgetPeriodFilter, BudgetRecord, BudgetViewModel } from '#features/budgets/model/types';

interface UseBudgetGridReturn {
  readonly budgets: readonly BudgetViewModel[];
  readonly isEmpty: boolean;
}

const doesPeriodOverlap = (budget: BudgetRecord, range: DateRange, now: Date): boolean => {
  if (!range.from || !range.to || budget.period === null) {
    return false;
  }
  const { from, to } = getPeriodRange(budget.period, now);
  // Overlap: budgetFrom <= rangeEnd AND budgetTo >= rangeStart
  return from <= range.to && to >= range.from;
};

export const useBudgetGrid = (
  activeTab: BudgetFilterTab,
  selectedPeriod: BudgetPeriodFilter,
  customRange?: DateRange,
): UseBudgetGridReturn => {
  const allBudgets = useBudgetsStore((s) => s.budgets);
  const transactions = useTransactionsStore((s) => s.transactions);
  const periodHistory = usePeriodHistoryStore((s) => s.history);

  const now = new Date();

  const standardBudgets = allBudgets.filter((b) => !b.isArchived && b.budgetType !== 'savings');

  // Savings filter is handled by a separate section on the page — grid shows nothing
  const activeBudgets = selectedPeriod === 'savings'
    ? []
    : selectedPeriod === 'custom'
      ? standardBudgets.filter((b) => customRange?.from && customRange.to && doesPeriodOverlap(b, customRange, now))
      : standardBudgets.filter((b) => b.period !== null && b.period.type === selectedPeriod);

  const viewModels = activeBudgets.map((b) => mapBudgetRecordToViewModel(b, transactions, now, periodHistory));

  const filtered = activeTab === 'needsAttention'
    ? viewModels.filter((b) => b.status === 'overBudget' || b.status === 'warning')
    : viewModels;

  return {
    budgets: filtered,
    isEmpty: filtered.length === 0,
  };
};
