import type { DateRange } from 'react-day-picker';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
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
  if (!range.from || !range.to) {
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

  const now = new Date();

  const activeBudgets = selectedPeriod === 'custom'
    ? allBudgets.filter((b) => !b.isArchived && customRange?.from && customRange.to && doesPeriodOverlap(b, customRange, now))
    : allBudgets.filter((b) => !b.isArchived && b.period.type === selectedPeriod);

  const viewModels = activeBudgets.map((b) => mapBudgetRecordToViewModel(b, transactions, now));

  const filtered = activeTab === 'needsAttention'
    ? viewModels.filter((b) => b.status === 'overBudget' || b.status === 'warning')
    : viewModels;

  return {
    budgets: filtered,
    isEmpty: filtered.length === 0,
  };
};
