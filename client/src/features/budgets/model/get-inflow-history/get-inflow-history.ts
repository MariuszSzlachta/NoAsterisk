import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { RolloverRecord } from '#features/budgets/model/types/rollover-record';
import type { SavingsInflowEntry } from '#features/budgets/model/types/savings-inflow-entry';

/** sourceBudgetName is undefined when the source budget has been deleted (orphan) */
export const getInflowHistory = (
  savingsBudgetId: string,
  history: readonly PeriodHistoryRecord[],
  allBudgets: readonly BudgetRecord[],
): readonly SavingsInflowEntry[] =>
  history
    .filter(
      (record): record is PeriodHistoryRecord & { readonly rollover: RolloverRecord } =>
        record.rollover?.targetType === 'savings_budget' &&
        record.rollover.targetBudgetId === savingsBudgetId,
    )
    .sort((a, b) => b.closedAt.localeCompare(a.closedAt))
    .map((record) => {
      const sourceBudget = allBudgets.find((b) => b.id === record.budgetId);
      return {
        id: record.id,
        amount: record.rollover.amount,
        sourceBudgetName: sourceBudget?.name,
        date: record.closedAt,
      };
    });
