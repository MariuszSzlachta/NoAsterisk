import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { BudgetPeriodRecord, BudgetRecord, BudgetType, CloseBudgetPeriodParams } from '#features/budgets/model/types';
import type { PeriodHistoryRecord } from '#features/budgets/model/period-history';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';

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

      createBudget: (props) =>
        set((state) => ({
          budgets: [
            ...state.budgets,
            {
              id: crypto.randomUUID(),
              workspaceId: 'default',
              budgetType: props.budgetType,
              name: props.name.trim(),
              color: props.color.trim(),
              limitAmount: props.limitAmount,
              limitCurrency: props.limitCurrency.toUpperCase(),
              period: props.period,
              categoryIds: props.categoryIds ?? [],
              createdAt: new Date().toISOString(),
              isArchived: false,
            },
          ],
        })),

      updateBudget: (id, props) =>
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
        })),

      archiveBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, isArchived: true } : b,
          ),
        })),

      deleteBudget: (id) =>
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        })),

      closeBudgetPeriod: (params) => {
        const budget = get().budgets.find((b) => b.id === params.budgetId);
        if (!budget || budget.period === null) {
          return;
        }

        // Build rollover record
        const rollover = params.rolloverOption.type === 'carry_forward'
          ? { amount: params.remainingAmount, targetType: 'same_budget' as const, targetBudgetId: params.budgetId }
          : params.rolloverOption.type === 'savings'
            ? { amount: params.remainingAmount, targetType: 'savings_budget' as const, targetBudgetId: params.rolloverOption.targetBudgetId }
            : null;

        // Build and persist history record
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

        usePeriodHistoryStore.getState().addClosedPeriod(historyRecord);

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
