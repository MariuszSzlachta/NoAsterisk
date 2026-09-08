import { create } from 'zustand';

import { createBudgetRecord } from '#features/budgets/model/create-budget-record';
import { isBudgetRecord } from '#features/budgets/model/is-budget-record';
import type { BudgetRecord } from '#features/budgets/model/types/budget-record';
import type { CreateBudgetProps } from '#features/budgets/model/types/create-budget-props';
import type { CloseBudgetPeriodParams } from '#features/budgets/model/types/close-budget-period-params';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import type { RolloverRecord } from '#features/budgets/model/types/rollover-record';
import type { UpdateBudgetProps } from '#features/budgets/model/types/update-budget-props';
import { updateBudgetRecord } from '#features/budgets/model/update-budget-record';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import { persistInBackground } from '#shared/adapters/persistence/persist-in-background';
import { encryptedPersistence } from '#shared/adapters/persistence/session';

const budgetRepository = encryptedPersistence.repository<BudgetRecord>(
  'budgets',
  isBudgetRecord,
  (record) => record.id,
);

interface BudgetsState {
  readonly budgets: ReadonlyArray<BudgetRecord>;
  readonly createBudget: (props: CreateBudgetProps) => void;
  readonly updateBudget: (id: string, props: UpdateBudgetProps) => void;
  readonly archiveBudget: (id: string) => void;
  readonly deleteBudget: (id: string) => void;
  readonly closeBudgetPeriod: (params: CloseBudgetPeriodParams) => void;
}


export const useBudgetsStore = create<BudgetsState>()((set, get) => ({
  budgets: [],

  createBudget: (props) => {
    const budget = createBudgetRecord(props);

    set((state) => ({ budgets: [...state.budgets, budget] }));
    persistInBackground(budgetRepository.put(budget));
  },

  updateBudget: (id, props) => {
    const existing = get().budgets.find((budget) => budget.id === id);
    if (!existing) {
      return;
    }
    const updated = updateBudgetRecord(existing, props);

    set((state) => ({
      budgets: state.budgets.map((budget) => (budget.id === id ? updated : budget)),
    }));
    persistInBackground(budgetRepository.put(updated));
  },

  archiveBudget: (id) => {
    const updated = get().budgets.find((budget) => budget.id === id);
    if (!updated) {
      return;
    }
    const archived = { ...updated, isArchived: true };
    set((state) => ({
      budgets: state.budgets.map((budget) => (budget.id === id ? archived : budget)),
    }));
    persistInBackground(budgetRepository.put(archived));
  },

  deleteBudget: (id) => {
    const updated = get().budgets.find((budget) => budget.id === id);
    if (!updated) {
      return;
    }
    const archived = { ...updated, isArchived: true };
    set((state) => ({
      budgets: state.budgets.map((budget) => (budget.id === id ? archived : budget)),
    }));
    persistInBackground(budgetRepository.put(archived));
  },

  closeBudgetPeriod: (params) => {
    const budget = get().budgets.find((item) => item.id === params.budgetId);
    if (!budget || budget.budgetType === 'savings') {
      return;
    }

    if (!Number.isFinite(params.spentAmount) || params.spentAmount < 0) {
      throw new Error('spentAmount must be a non-negative finite number');
    }
    if (!Number.isFinite(params.remainingAmount)) {
      throw new Error('remainingAmount must be a finite number');
    }

    const rolloverOption = params.rolloverOption;
    if (rolloverOption.type === 'savings') {
      const targetExists = get().budgets.some(
        (item) => item.id === rolloverOption.targetBudgetId && item.budgetType === 'savings',
      );
      if (!targetExists) {
        throw new Error('Savings target budget not found or is not a savings budget');
      }
    }

    const rollover: RolloverRecord | null = rolloverOption.type === 'carry_forward'
      ? { amount: params.remainingAmount, targetType: 'same_budget', targetBudgetId: params.budgetId }
      : rolloverOption.type === 'savings'
        ? { amount: params.remainingAmount, targetType: 'savings_budget', targetBudgetId: rolloverOption.targetBudgetId }
        : null;

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

    const wasAdded = usePeriodHistoryStore.getState().addClosedPeriod(historyRecord);
    if (!wasAdded) {
      return;
    }

    const newLimit = rolloverOption.type === 'carry_forward'
      ? budget.limitAmount + params.remainingAmount
      : budget.limitAmount;
    const updated = { ...budget, period: params.nextPeriod, limitAmount: newLimit };
    set((state) => ({
      budgets: state.budgets.map((item) => (item.id === params.budgetId ? updated : item)),
    }));
    persistInBackground(budgetRepository.put(updated));
  },
}));
