import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';

export const computeSavingsBalance = (
  savingsBudgetId: string,
  history: readonly PeriodHistoryRecord[],
): number =>
  history.reduce((total, record) => {
    if (record.rollover?.targetType !== 'savings_budget' || record.rollover.targetBudgetId !== savingsBudgetId) {
      return total;
    }
    return total + record.rollover.amount;
  }, 0);
