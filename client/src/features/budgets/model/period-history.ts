import type { BudgetRecord, SavingsInflowEntry } from './types';

// ─── Rollover Types ──────────────────────────────────────────────

export type RolloverTargetType = 'same_budget' | 'savings_budget';

export interface RolloverRecord {
  readonly amount: number;
  readonly targetType: RolloverTargetType;
  readonly targetBudgetId: string;
}

// ─── Period History Record ───────────────────────────────────────

export interface PeriodHistoryRecord {
  readonly id: string;
  readonly budgetId: string;
  readonly periodFrom: string;
  readonly periodTo: string;
  readonly limitAmount: number;
  readonly spentAmount: number;
  readonly remainingAmount: number;
  readonly closedAt: string;
  readonly rollover: RolloverRecord | null;
}

// ─── Idempotency Check ──────────────────────────────────────────

/**
 * Checks if a period has already been closed (duplicate detection).
 * Key: (budgetId, periodFrom, periodTo)
 */
export const isDuplicateClosure = (
  record: PeriodHistoryRecord,
  existingHistory: readonly PeriodHistoryRecord[],
): boolean =>
  existingHistory.some(
    (existing) =>
      existing.budgetId === record.budgetId &&
      existing.periodFrom === record.periodFrom &&
      existing.periodTo === record.periodTo,
  );

// ─── Pure computation: savings balance ───────────────────────────

/**
 * Computes the accumulated balance for a savings budget.
 * Balance = sum of all rollover amounts targeting this savings budget.
 */
export const computeSavingsBalance = (
  savingsBudgetId: string,
  history: readonly PeriodHistoryRecord[],
): number =>
  history.reduce((total, record) => {
    if (record.rollover?.targetType === 'savings_budget' && record.rollover.targetBudgetId === savingsBudgetId) {
      return total + record.rollover.amount;
    }
    return total;
  }, 0);

// ─── Pure computation: all inflows for history display ───────────

/**
 * Returns all rollovers targeting a savings budget, sorted newest-first.
 * `sourceBudgetName` is undefined when the source budget has been deleted (orphan).
 */
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

// ─── Pure computation: last inflow into savings ──────────────────

/**
 * Finds the most recent rollover inflow into a savings budget.
 * Returns null if no rollovers target this budget.
 */
export const getLastInflow = (
  savingsBudgetId: string,
  history: readonly PeriodHistoryRecord[],
  allBudgets: readonly BudgetRecord[],
): SavingsInflowEntry | null => {
  const inflows = getInflowHistory(savingsBudgetId, history, allBudgets);
  return inflows[0] ?? null;
};
