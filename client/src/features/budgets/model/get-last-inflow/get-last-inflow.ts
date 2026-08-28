import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { SavingsInflowEntry } from '#features/budgets/model/types/savings-inflow-entry';

import { getInflowHistory } from '#features/budgets/model/get-inflow-history';

export const getLastInflow = (
  savingsBudgetId: string,
  history: readonly PeriodHistoryRecord[],
  allBudgets: readonly BudgetRecord[],
): SavingsInflowEntry | null => {
  const inflows = getInflowHistory(savingsBudgetId, history, allBudgets);
  return inflows[0] ?? null;
};
