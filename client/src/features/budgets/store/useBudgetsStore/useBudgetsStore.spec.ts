import { describe, it, expect, beforeEach } from 'vitest';

import { useBudgetsStore } from './useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';

// ─── Helpers ─────────────────────────────────────────────────────

const createTestBudget = (): void => {
  useBudgetsStore.getState().createBudget({
    name: 'Groceries',
    budgetType: 'standard',
    color: '#34d399',
    limitAmount: 2000,
    limitCurrency: 'PLN',
    period: { type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' },
  });
};

const getFirstBudgetId = (): string => {
  const budgets = useBudgetsStore.getState().budgets;
  const first = budgets[0];
  if (!first) {
    throw new Error('No budgets in store');
  }
  return first.id;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('useBudgetsStore', () => {
  beforeEach(() => {
    useBudgetsStore.setState({ budgets: [] });
    usePeriodHistoryStore.setState({ history: [] });
  });

  describe('closeBudgetPeriod', () => {
    it('records period history with carry_forward rollover', () => {
      createTestBudget();
      const budgetId = getFirstBudgetId();

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1500,
        remainingAmount: 500,
        rolloverOption: { type: 'carry_forward' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const history = usePeriodHistoryStore.getState().history;
      expect(history).toHaveLength(1);
      expect(history[0]?.rollover).toEqual({
        amount: 500,
        targetType: 'same_budget',
        targetBudgetId: budgetId,
      });
    });

    it('increases limit on carry_forward', () => {
      createTestBudget();
      const budgetId = getFirstBudgetId();

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1500,
        remainingAmount: 500,
        rolloverOption: { type: 'carry_forward' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === budgetId);
      expect(budget?.limitAmount).toBe(2500); // 2000 + 500
    });

    it('records period history with savings rollover', () => {
      createTestBudget();
      const budgetId = getFirstBudgetId();

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1800,
        remainingAmount: 200,
        rolloverOption: { type: 'savings', targetBudgetId: 'savings-1' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const history = usePeriodHistoryStore.getState().history;
      expect(history[0]?.rollover).toEqual({
        amount: 200,
        targetType: 'savings_budget',
        targetBudgetId: 'savings-1',
      });
    });

    it('keeps limit unchanged on savings rollover', () => {
      createTestBudget();
      const budgetId = getFirstBudgetId();

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1800,
        remainingAmount: 200,
        rolloverOption: { type: 'savings', targetBudgetId: 'savings-1' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === budgetId);
      expect(budget?.limitAmount).toBe(2000); // unchanged
    });

    it('records null rollover on discard', () => {
      createTestBudget();
      const budgetId = getFirstBudgetId();

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 2000,
        remainingAmount: 0,
        rolloverOption: { type: 'discard' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const history = usePeriodHistoryStore.getState().history;
      expect(history[0]?.rollover).toBeNull();
    });

    it('updates budget period to nextPeriod', () => {
      createTestBudget();
      const budgetId = getFirstBudgetId();

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1500,
        remainingAmount: 500,
        rolloverOption: { type: 'discard' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === budgetId);
      expect(budget?.period).toEqual({ type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' });
    });

    it('does nothing when budget not found', () => {
      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId: 'non-existent',
        spentAmount: 0,
        remainingAmount: 0,
        rolloverOption: { type: 'discard' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const history = usePeriodHistoryStore.getState().history;
      expect(history).toHaveLength(0);
    });

    it('does nothing for savings budget (period: null)', () => {
      useBudgetsStore.getState().createBudget({
        name: 'Savings',
        budgetType: 'savings',
        color: '#10b981',
        limitAmount: 10000,
        limitCurrency: 'PLN',
        period: null,
      });

      const savingsId = useBudgetsStore.getState().budgets[0]?.id ?? '';

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId: savingsId,
        spentAmount: 0,
        remainingAmount: 0,
        rolloverOption: { type: 'discard' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const history = usePeriodHistoryStore.getState().history;
      expect(history).toHaveLength(0);
    });
  });
});
