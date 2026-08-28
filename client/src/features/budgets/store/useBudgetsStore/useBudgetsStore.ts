import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BudgetPeriodRecord } from '#features/budgets/model/types/budget-period-record';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { BudgetType } from '#features/budgets/model/types/budget-type';
import type { CloseBudgetPeriodParams } from '#features/budgets/model/types/close-budget-period-params';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';

// ─── Validation ──────────────────────────────────────────────────

const validateBudgetInvariants = (budgetType: BudgetType, period: BudgetPeriodRecord | null, limitAmount: number): void => {
  if (budgetType === 'standard' && period === null) {
    throw new Error('Standard budget must have a period');
  }
  if (budgetType === 'savings' && period !== null) {
    throw new Error('Savings budget must not have a period');
  }
  if (!Number.isFinite(limitAmount) || limitAmount < 0) {
    throw new Error('limitAmount must be a non-negative finite number');
  }
};

const validateUpdateInvariants = (existing: BudgetRecord, props: UpdateBudgetProps): void => {
  const limitAmount = props.limitAmount ?? existing.limitAmount;
  const period = props.period !== undefined ? props.period : existing.period;

  if (!Number.isFinite(limitAmount) || limitAmount < 0) {
    throw new Error('limitAmount must be a non-negative finite number');
  }

  // Standard budget: period must remain non-null
  if (existing.budgetType === 'standard' && period === null) {
    throw new Error('Cannot remove period from standard budget');
  }

  // Savings budget: period must remain null
  if (existing.budgetType === 'savings' && period !== null) {
    throw new Error('Cannot add period to savings budget');
  }
};

// ─── State Interface ─────────────────────────────────────────────

interface BudgetsState {
  readonly budgets: ReadonlyArray<BudgetRecord>;
  readonly createBudget: (props: CreateBudgetProps) => void;
  readonly updateBudget: (id: string, props: UpdateBudgetProps) => void;
  readonly archiveBudget: (id: string) => void;
  readonly deleteBudget: (id: string) => void;
  readonly closeBudgetPeriod: (params: CloseBudgetPeriodParams) => void;
}

interface CreateBudgetProps {
  readonly workspaceId: string;
  readonly name: string;
  readonly budgetType: BudgetType;
  readonly color: string;
  readonly limitAmount: number;
  readonly limitCurrency: string;
  readonly period: BudgetPeriodRecord | null;
  readonly categoryIds?: readonly string[];
}

interface UpdateBudgetProps {
  readonly name?: string;
  readonly color?: string;
  readonly limitAmount?: number;
  readonly limitCurrency?: string;
  readonly period?: BudgetPeriodRecord | null;
  readonly categoryIds?: readonly string[];
}

// ─── Store ───────────────────────────────────────────────────────

export const useBudgetsStore = create<BudgetsState>()(
  persist(
    (set, get) => ({
      budgets: [],

      createBudget: (props) => {
        validateBudgetInvariants(props.budgetType, props.period, props.limitAmount);

        set((state) => ({
          budgets: [
            ...state.budgets,
            {
              id: crypto.randomUUID(),
              workspaceId: props.workspaceId,
              budgetType: props.budgetType,
              name: props.name.trim(),
              color: props.color.trim(),
              limitAmount: props.limitAmount,
              limitCurrency: props.limitCurrency.toUpperCase(),
              period: props.period,
              categoryIds: props.categoryIds ?? [],
              createdAt: new Date().toISOString(),
              isArchived: false,
            } as BudgetRecord,
          ],
        }));
      },

      updateBudget: (id, props) => {
        const existing = get().budgets.find((b) => b.id === id);
        if (!existing) {
          return;
        }

        validateUpdateInvariants(existing, props);

        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...(props.name !== undefined && { name: props.name.trim() }),
                  ...(props.color !== undefined && { color: props.color.trim() }),
                  ...(props.limitAmount !== undefined && { limitAmount: props.limitAmount }),
                  ...(props.limitCurrency !== undefined && { limitCurrency: props.limitCurrency.toUpperCase() }),
                  ...(props.period !== undefined && { period: props.period }),
                  ...(props.categoryIds !== undefined && { categoryIds: props.categoryIds }),
                }
              : b,
          ),
        }));
      },

      archiveBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, isArchived: true } : b,
          ),
        })),

      /**
       * Soft-deletes a budget by archiving it.
       * Period history records are preserved for audit trail.
       * Use archiveBudget for reversible operation.
       */
      deleteBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, isArchived: true } : b,
          ),
        })),

      closeBudgetPeriod: (params) => {
        const budget = get().budgets.find((b) => b.id === params.budgetId);
        if (!budget || budget.period === null) {
          return;
        }

        // Validate amounts are consistent
        if (!Number.isFinite(params.spentAmount) || params.spentAmount < 0) {
          throw new Error('spentAmount must be a non-negative finite number');
        }
        if (!Number.isFinite(params.remainingAmount)) {
          throw new Error('remainingAmount must be a finite number');
        }

        // Validate savings target exists when rollover is savings
        if (params.rolloverOption.type === 'savings') {
          const targetBudgetId = params.rolloverOption.targetBudgetId;
          const targetExists = get().budgets.some(
            (b) => b.id === targetBudgetId && b.budgetType === 'savings',
          );
          if (!targetExists) {
            throw new Error('Savings target budget not found or is not a savings budget');
          }
        }

        // Build rollover record
        const rollover = params.rolloverOption.type === 'carry_forward'
          ? { amount: params.remainingAmount, targetType: 'same_budget' as const, targetBudgetId: params.budgetId }
          : params.rolloverOption.type === 'savings'
            ? { amount: params.remainingAmount, targetType: 'savings_budget' as const, targetBudgetId: params.rolloverOption.targetBudgetId }
            : null;

        // Build history record
        const historyRecord: PeriodHistoryRecord = {
          id: crypto.randomUUID(),
          budgetId: params.budgetId,
          periodFrom: params.periodFrom,
          periodTo: params.periodTo,
          limitAmount: budget.limitAmount,
          spentAmount: params.spentAmount,
          remainingAmount: params.remainingAmount,
          closedAt: new Date().toISOString(),
          rollover,
        };

        // Persist history (idempotency-checked by the history store)
        const wasAdded = usePeriodHistoryStore.getState().addClosedPeriod(historyRecord);
        if (!wasAdded) {
          // Period already closed — idempotent no-op
          return;
        }

        // Compute new limit for next period
        const newLimit = params.rolloverOption.type === 'carry_forward'
          ? budget.limitAmount + params.remainingAmount
          : budget.limitAmount;

        // Update budget with new period and limit
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === params.budgetId
              ? { ...b, period: params.nextPeriod, limitAmount: newLimit }
              : b,
          ),
        }));
      },
    }),
    {
      name: 'budget-budgets',
    },
  ),
);
