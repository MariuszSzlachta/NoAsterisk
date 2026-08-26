import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays, parseISO, endOfDay, addDays } from 'date-fns';

import { computeBudgetStatus } from './budget-status';
import { computeSavingsBalance, getLastInflow } from './period-history';
import type { PeriodHistoryRecord } from './period-history';
import type {
  BudgetPeriodRecord,
  BudgetRecord,
  BudgetTransactionInput,
  BudgetTransactionVM,
  BudgetViewModel,
  SavingsBudgetViewModel,
  StandardBudgetRecord,
} from './types';
import { isStandardBudget } from './types';

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
      return { from: parseISO(period.dateFrom), to: endOfDay(parseISO(period.dateTo)) };
  }
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
  if (!isStandardBudget(budget)) {
    throw new Error(`mapBudgetRecordToViewModel called on savings budget "${budget.id}". Use mapSavingsBudgetToViewModel instead.`);
  }

  const standardBudget: StandardBudgetRecord = budget;
  const { from, to } = getPeriodRange(standardBudget.period, now);

  const budgetTransactions = filterTransactionsForBudget(allTransactions, standardBudget.id, from, to);
  const rawSpent = -budgetTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const spent = Math.max(0, rawSpent);

  const totalDays = differenceInDays(to, from) + 1;
  const daysElapsed = Math.max(0, differenceInDays(now, from) + 1);
  const daysRemaining = Math.max(0, differenceInDays(to, now));

  const remaining = standardBudget.limitAmount - spent;
  const rawProgressPercent = standardBudget.limitAmount > 0
    ? Math.round((spent / standardBudget.limitAmount) * 100)
    : 0;
  const progressPercent = Math.min(100, rawProgressPercent);

  const periodEnded = now > to && !hasBeenClosed(standardBudget.id, from, to, periodHistory);

  const status = computeBudgetStatus(spent, standardBudget.limitAmount, daysElapsed, totalDays, budgetTransactions.length, periodEnded);

  const spentPercent = standardBudget.limitAmount > 0 ? Math.round((spent / standardBudget.limitAmount) * 100) : 0;
  const timePercent = totalDays > 0 ? Math.round((daysElapsed / totalDays) * 100) : 0;

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

// ─── Period label formatting (presentation helper) ───────────────

/**
 * Formats a date range as a period label for display.
 * This is a presentation concern kept in transformers for practical bundling;
 * it uses date-fns format which is locale-aware.
 */
const formatPeriodLabel = (from: Date, to: Date): string => {
  const fromStr = format(from, 'd');
  const toStr = format(to, 'd MMM');
  return `${fromStr}–${toStr}`;
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
      const durationDays = differenceInDays(to, from);
      const nextFrom = addDays(to, 1);
      const nextTo = addDays(nextFrom, durationDays);
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
