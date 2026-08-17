import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

import { computeBudgetStatus, getStatusLabelKey } from './budget-status';
import { computeSavingsBalance, getLastInflow } from './period-history';
import type { PeriodHistoryRecord } from './period-history';
import type { BudgetPeriodRecord, BudgetRecord, BudgetTransactionInput, BudgetTransactionVM, BudgetViewModel, SavingsBudgetViewModel } from './types';

// ─── Period helpers ──────────────────────────────────────────────

export const getPeriodRange = (
  period: BudgetPeriodRecord,
  now: Date,
): { from: Date; to: Date } => {
  switch (period.type) {
    case 'monthly':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'yearly':
      return { from: startOfYear(now), to: endOfYear(now) };
    case 'custom':
      return { from: parseISO(period.dateFrom), to: parseISO(period.dateTo) };
  }
};

const formatPeriodLabel = (from: Date, to: Date): string => {
  const fromStr = format(from, 'd', { locale: pl });
  const toStr = format(to, 'd MMMM', { locale: pl });
  return `${fromStr}–${toStr}`;
};

// ─── Transaction filtering ───────────────────────────────────────

const filterTransactionsForBudget = (
  transactions: readonly BudgetTransactionInput[],
  budgetId: string,
  from: Date,
  to: Date,
): readonly BudgetTransactionInput[] =>
  transactions.filter((tx) => {
    if (tx.budgetId !== budgetId) {
      return false;
    }
    const txDate = parseISO(tx.date);
    return txDate >= from && txDate <= to;
  });

const mapToTransactionVM = (tx: BudgetTransactionInput): BudgetTransactionVM => ({
  id: tx.id,
  description: tx.description,
  amount: tx.amount,
  currency: tx.currency,
  date: tx.date,
});

// ─── Main transformer (standard budgets) ─────────────────────────

export const mapBudgetRecordToViewModel = (
  budget: BudgetRecord,
  allTransactions: readonly BudgetTransactionInput[],
  now: Date,
  periodHistory?: readonly PeriodHistoryRecord[],
): BudgetViewModel => {
  if (budget.period === null) {
    throw new Error(`mapBudgetRecordToViewModel called on savings budget "${budget.id}". Use mapSavingsBudgetToViewModel instead.`);
  }

  const { from, to } = getPeriodRange(budget.period, now);

  const budgetTransactions = filterTransactionsForBudget(allTransactions, budget.id, from, to);
  // Expenses are negative amounts, refunds are positive.
  // Spent = negated sum: -(-150 + -100 + 50) = 200
  const rawSpent = -budgetTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const spent = Math.max(0, rawSpent);

  const totalDays = differenceInDays(to, from) + 1;
  const daysElapsed = Math.max(0, differenceInDays(now, from) + 1);
  const daysRemaining = Math.max(0, differenceInDays(to, now));

  const remaining = budget.limitAmount - spent;
  const rawProgressPercent = budget.limitAmount > 0
    ? Math.round((spent / budget.limitAmount) * 100)
    : 0;
  // Capped at 100 for Progress bar rendering; over-budget shown via status/color
  const progressPercent = Math.min(100, rawProgressPercent);

  // Period ended = now is past the period's end AND no closure recorded in history
  const periodEnded = now > to && !hasBeenClosed(budget.id, from, to, periodHistory);

  const status = computeBudgetStatus(spent, budget.limitAmount, daysElapsed, totalDays, budgetTransactions.length, periodEnded);

  const spentPercent = budget.limitAmount > 0 ? Math.round((spent / budget.limitAmount) * 100) : 0;
  const timePercent = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;

  return {
    id: budget.id,
    name: budget.name,
    color: budget.color,
    status,
    statusLabel: getStatusLabelKey(status),
    periodLabel: formatPeriodLabel(from, to),
    daysRemaining,
    spent,
    limit: budget.limitAmount,
    remaining,
    currency: budget.limitCurrency,
    progressPercent,
    spentPercent,
    timePercent,
    transactions: budgetTransactions.map(mapToTransactionVM),
  };
};

// ─── Savings budget transformer ──────────────────────────────────

export const mapSavingsBudgetToViewModel = (
  budget: BudgetRecord,
  periodHistory: readonly PeriodHistoryRecord[],
  allBudgets: readonly BudgetRecord[],
): SavingsBudgetViewModel => {
  const accumulated = computeSavingsBalance(budget.id, periodHistory);
  const goalAmount = budget.limitAmount;
  const progressPercent = goalAmount > 0
    ? Math.min(100, Math.round((accumulated / goalAmount) * 100))
    : 0;
  const lastInflow = getLastInflow(budget.id, periodHistory, allBudgets);

  return {
    id: budget.id,
    name: budget.name,
    color: budget.color,
    accumulated,
    goalAmount,
    currency: budget.limitCurrency,
    progressPercent,
    lastInflow,
  };
};

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Computes the next period after closure.
 * - monthly/yearly: preserved as-is (they auto-advance via getPeriodRange).
 * - custom: next period starts day after current end, same duration.
 */
export const computeNextPeriod = (currentPeriod: BudgetPeriodRecord): BudgetPeriodRecord => {
  switch (currentPeriod.type) {
    case 'monthly':
      return { type: 'monthly' };
    case 'yearly':
      return { type: 'yearly' };
    case 'custom': {
      const from = parseISO(currentPeriod.dateFrom);
      const to = parseISO(currentPeriod.dateTo);
      const durationMs = to.getTime() - from.getTime();
      const nextFrom = new Date(to.getTime() + 86400000);
      const nextTo = new Date(nextFrom.getTime() + durationMs);
      return { type: 'custom', dateFrom: format(nextFrom, 'yyyy-MM-dd'), dateTo: format(nextTo, 'yyyy-MM-dd') };
    }
  }
};

/**
 * Checks if a given budget period has already been closed (exists in history).
 */
const hasBeenClosed = (
  budgetId: string,
  periodFrom: Date,
  periodTo: Date,
  history?: readonly PeriodHistoryRecord[],
): boolean => {
  if (!history) {
    return false;
  }
  const fromStr = format(periodFrom, 'yyyy-MM-dd');
  const toStr = format(periodTo, 'yyyy-MM-dd');
  return history.some(
    (record) =>
      record.budgetId === budgetId &&
      record.periodFrom === fromStr &&
      record.periodTo === toStr,
  );
};
