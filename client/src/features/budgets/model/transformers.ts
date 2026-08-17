import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays, parseISO } from 'date-fns';
import { pl } from 'date-fns/locale';

import { computeBudgetStatus, getStatusLabelKey } from './budget-status';
import type { BudgetRecord, BudgetTransactionInput, BudgetTransactionVM, BudgetViewModel } from './types';

// ─── Period helpers ──────────────────────────────────────────────

export const getPeriodRange = (
  period: BudgetRecord['period'],
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

// ─── Main transformer ────────────────────────────────────────────

export const mapBudgetRecordToViewModel = (
  budget: BudgetRecord,
  allTransactions: readonly BudgetTransactionInput[],
  now: Date,
): BudgetViewModel => {
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

  const status = computeBudgetStatus(spent, budget.limitAmount, daysElapsed, totalDays, budgetTransactions.length);

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
