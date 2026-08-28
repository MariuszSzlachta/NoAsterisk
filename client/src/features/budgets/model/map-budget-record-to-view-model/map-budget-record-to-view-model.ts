import { differenceInDays } from 'date-fns';

import { computeBudgetStatus } from '#features/budgets/model/compute-budget-status';
import { DAY_OFFSET } from '#features/budgets/model/constants/day-offset';
import { MAX_PROGRESS } from '#features/budgets/model/constants/max-progress';
import { MIN_PROGRESS } from '#features/budgets/model/constants/min-progress';
import { PERCENTAGE_MULTIPLIER } from '#features/budgets/model/constants/percentage-multiplier';
import { filterTransactionsForBudget } from '#features/budgets/model/filter-transactions-for-budget';
import { formatPeriodLabel } from '#features/budgets/model/format-period-label';
import { getPeriodRange } from '#features/budgets/model/get-period-range';
import { hasBeenClosed } from '#features/budgets/model/has-been-closed';
import { mapToTransactionVM } from '#features/budgets/model/map-to-transaction-vm';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { BudgetTransactionInput } from '#features/budgets/model/types/budget-transaction-input';
import type { BudgetViewModel } from '#features/budgets/model/types/budget-view-model';
import { isStandardBudget } from '#features/budgets/model/types/is-standard-budget';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { StandardBudgetRecord } from '#features/budgets/model/types/standard-budget-record';

export const mapBudgetRecordToViewModel = (
  budget: BudgetRecord,
  allTransactions: readonly BudgetTransactionInput[],
  now: Date,
  periodHistory?: readonly PeriodHistoryRecord[],
): BudgetViewModel => {
  if (!isStandardBudget(budget)) {
    throw new Error(`mapBudgetRecordToViewModel called on savings budget "${budget.id}". Use mapSavingsBudgetToViewModel instead.`);
  }

  const standardBudget: StandardBudgetRecord = budget;
  const { from, to } = getPeriodRange(standardBudget.period, now);

  const budgetTransactions = filterTransactionsForBudget(allTransactions, standardBudget.id, from, to);
  const rawSpent = -budgetTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const spent = Math.max(MIN_PROGRESS, rawSpent);

  const totalDays = differenceInDays(to, from) + DAY_OFFSET;
  const daysElapsed = Math.max(MIN_PROGRESS, differenceInDays(now, from) + DAY_OFFSET);
  const daysRemaining = Math.max(MIN_PROGRESS, differenceInDays(to, now));

  const remaining = standardBudget.limitAmount - spent;
  const rawProgressPercent = standardBudget.limitAmount > 0
    ? Math.round((spent / standardBudget.limitAmount) * PERCENTAGE_MULTIPLIER)
    : MIN_PROGRESS;
  const progressPercent = Math.min(MAX_PROGRESS, rawProgressPercent);

  const periodEnded = now > to && !hasBeenClosed(standardBudget.id, from, to, periodHistory);

  const status = computeBudgetStatus(spent, standardBudget.limitAmount, daysElapsed, totalDays, budgetTransactions.length, periodEnded);

  const spentPercent = standardBudget.limitAmount > 0 ? Math.round((spent / standardBudget.limitAmount) * PERCENTAGE_MULTIPLIER) : MIN_PROGRESS;
  const timePercent = totalDays > 0 ? Math.round((daysElapsed / totalDays) * PERCENTAGE_MULTIPLIER) : MIN_PROGRESS;

  return {
    id: standardBudget.id,
    name: standardBudget.name,
    color: standardBudget.color,
    status,
    statusLabel: status,
    periodLabel: formatPeriodLabel(from, to),
    daysRemaining,
    spent,
    limit: standardBudget.limitAmount,
    remaining,
    currency: standardBudget.limitCurrency,
    progressPercent,
    spentPercent,
    timePercent,
    transactions: budgetTransactions.map(mapToTransactionVM),
  };
};
