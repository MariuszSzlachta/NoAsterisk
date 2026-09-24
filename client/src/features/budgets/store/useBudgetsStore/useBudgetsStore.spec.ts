import { beforeEach, describe, expect, it } from 'vitest';

import { useBudgetsStore } from './useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';

// ─── Helpers ─────────────────────────────────────────────────────

const createStandardBudget = (overrides?: Record<string, unknown>): void => {
  useBudgetsStore.getState().createBudget({
    workspaceId: 'ws-test',
    name: 'Groceries',
    budgetType: 'standard',
    color: '#34d399',
    limitAmount: 2000,
    limitCurrency: 'PLN',
    period: { type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' },
    ...overrides,
  });
};

const createSavingsBudget = (overrides?: Record<string, unknown>): void => {
  useBudgetsStore.getState().createBudget({
    workspaceId: 'ws-test',
    name: 'Savings Fund',
    budgetType: 'savings',
    color: '#10b981',
    limitAmount: 10000,
    limitCurrency: 'PLN',
    period: null,
    ...overrides,
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

  // ─── createBudget ────────────────────────────────────────────

  describe('createBudget', () => {
    it('creates a standard budget with all fields', () => {
      createStandardBudget();

      const budgets = useBudgetsStore.getState().budgets;
      expect(budgets).toHaveLength(1);
      expect(budgets[0]).toMatchObject({
        workspaceId: 'ws-test',
        budgetType: 'standard',
        name: 'Groceries',
        color: '#34d399',
        limitAmount: 2000,
        limitCurrency: 'PLN',
        period: { type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' },
        categoryIds: [],
        isArchived: false,
      });
    });

    it('generates a unique id', () => {
      createStandardBudget();
      createStandardBudget({ name: 'Second' });

      const budgets = useBudgetsStore.getState().budgets;
      expect(budgets[0]?.id).not.toBe(budgets[1]?.id);
    });

    it('trims name and color', () => {
      createStandardBudget({ name: '  Groceries  ', color: '  #ff0000  ' });

      const budget = useBudgetsStore.getState().budgets[0];
      expect(budget?.name).toBe('Groceries');
      expect(budget?.color).toBe('#ff0000');
    });

    it('uppercases currency', () => {
      createStandardBudget({ limitCurrency: 'pln' });

      const budget = useBudgetsStore.getState().budgets[0];
      expect(budget?.limitCurrency).toBe('PLN');
    });

    it('creates a savings budget with null period', () => {
      createSavingsBudget();

      const budget = useBudgetsStore.getState().budgets[0];
      expect(budget?.budgetType).toBe('savings');
      expect(budget?.period).toBeNull();
    });

    it('sets createdAt to ISO string', () => {
      createStandardBudget();

      const budget = useBudgetsStore.getState().budgets[0];
      expect(budget?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('throws when standard budget has null period', () => {
      expect(() => {
        useBudgetsStore.getState().createBudget({
          workspaceId: 'ws-test',
          name: 'Invalid',
          budgetType: 'standard',
          color: '#000',
          limitAmount: 100,
          limitCurrency: 'PLN',
          period: null,
        });
      }).toThrow('Standard budget must have a period');
    });

    it('throws when savings budget has non-null period', () => {
      expect(() => {
        useBudgetsStore.getState().createBudget({
          workspaceId: 'ws-test',
          name: 'Invalid',
          budgetType: 'savings',
          color: '#000',
          limitAmount: 100,
          limitCurrency: 'PLN',
          period: { type: 'monthly' },
        });
      }).toThrow('Savings budget must not have a period');
    });

    it('throws when limitAmount is negative', () => {
      expect(() => {
        createStandardBudget({ limitAmount: -100 });
      }).toThrow('limitAmount must be a non-negative finite number');
    });

    it('throws when limitAmount is Infinity', () => {
      expect(() => {
        createStandardBudget({ limitAmount: Infinity });
      }).toThrow('limitAmount must be a non-negative finite number');
    });
  });

  // ─── updateBudget ───────────────────────────────────────────

  describe('updateBudget', () => {
    it('updates name', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      useBudgetsStore.getState().updateBudget(id, { name: 'Updated' });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === id);
      expect(budget?.name).toBe('Updated');
    });

    it('updates limitAmount', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      useBudgetsStore.getState().updateBudget(id, { limitAmount: 5000 });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === id);
      expect(budget?.limitAmount).toBe(5000);
    });

    it('does nothing when budget not found', () => {
      createStandardBudget();

      useBudgetsStore.getState().updateBudget('non-existent', { name: 'X' });

      expect(useBudgetsStore.getState().budgets[0]?.name).toBe('Groceries');
    });

    it('throws when removing period from standard budget', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      expect(() => {
        useBudgetsStore.getState().updateBudget(id, { period: null });
      }).toThrow('Cannot remove period from standard budget');
    });

    it('throws when adding period to savings budget', () => {
      createSavingsBudget();
      const id = getFirstBudgetId();

      expect(() => {
        useBudgetsStore.getState().updateBudget(id, { period: { type: 'monthly' } });
      }).toThrow('Cannot add period to savings budget');
    });

    it('throws when setting negative limitAmount', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      expect(() => {
        useBudgetsStore.getState().updateBudget(id, { limitAmount: -1 });
      }).toThrow('limitAmount must be a non-negative finite number');
    });

    it('preserves other fields on partial update', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      useBudgetsStore.getState().updateBudget(id, { name: 'New Name' });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === id);
      expect(budget?.limitAmount).toBe(2000);
      expect(budget?.color).toBe('#34d399');
      expect(budget?.period).toEqual({ type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' });
    });
  });

  // ─── archiveBudget ──────────────────────────────────────────

  describe('archiveBudget', () => {
    it('sets isArchived to true', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      useBudgetsStore.getState().archiveBudget(id);

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === id);
      expect(budget?.isArchived).toBe(true);
    });

    it('does not remove budget from list', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      useBudgetsStore.getState().archiveBudget(id);

      expect(useBudgetsStore.getState().budgets).toHaveLength(1);
    });
  });

  // ─── deleteBudget ───────────────────────────────────────────

  describe('deleteBudget', () => {
    it('soft-deletes by archiving', () => {
      createStandardBudget();
      const id = getFirstBudgetId();

      useBudgetsStore.getState().deleteBudget(id);

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === id);
      expect(budget?.isArchived).toBe(true);
    });
  });

  // ─── closeBudgetPeriod ──────────────────────────────────────

  describe('closeBudgetPeriod', () => {
    it('records period history with carry_forward rollover', () => {
      createStandardBudget();
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
      createStandardBudget();
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
      expect(budget?.limitAmount).toBe(2500);
    });

    it('records period history with savings rollover', () => {
      createStandardBudget();
      const budgetId = getFirstBudgetId();

      createSavingsBudget();
      const savingsId = useBudgetsStore.getState().budgets[1]?.id ?? '';

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1800,
        remainingAmount: 200,
        rolloverOption: { type: 'savings', targetBudgetId: savingsId },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const history = usePeriodHistoryStore.getState().history;
      expect(history[0]?.rollover).toEqual({
        amount: 200,
        targetType: 'savings_budget',
        targetBudgetId: savingsId,
      });
    });

    it('keeps limit unchanged on savings rollover', () => {
      createStandardBudget();
      const budgetId = getFirstBudgetId();

      createSavingsBudget();
      const savingsId = useBudgetsStore.getState().budgets[1]?.id ?? '';

      useBudgetsStore.getState().closeBudgetPeriod({
        budgetId,
        spentAmount: 1800,
        remainingAmount: 200,
        rolloverOption: { type: 'savings', targetBudgetId: savingsId },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      });

      const budget = useBudgetsStore.getState().budgets.find((b) => b.id === budgetId);
      expect(budget?.limitAmount).toBe(2000);
    });

    it('records null rollover on discard', () => {
      createStandardBudget();
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
      createStandardBudget();
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
      createSavingsBudget();
      const savingsId = getFirstBudgetId();

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

    it('is idempotent — second call for same period is no-op', () => {
      createStandardBudget();
      const budgetId = getFirstBudgetId();

      const params = {
        budgetId,
        spentAmount: 1500,
        remainingAmount: 500,
        rolloverOption: { type: 'carry_forward' },
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
      };

      useBudgetsStore.getState().closeBudgetPeriod(params);
      useBudgetsStore.getState().closeBudgetPeriod(params);

      const history = usePeriodHistoryStore.getState().history;
      expect(history).toHaveLength(1);
    });

    it('throws when savings target does not exist', () => {
      createStandardBudget();
      const budgetId = getFirstBudgetId();

      expect(() => {
        useBudgetsStore.getState().closeBudgetPeriod({
          budgetId,
          spentAmount: 1800,
          remainingAmount: 200,
          rolloverOption: { type: 'savings', targetBudgetId: 'non-existent' },
          periodFrom: '2026-07-01',
          periodTo: '2026-07-31',
          nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
        });
      }).toThrow('Savings target budget not found');
    });

    it('throws when spentAmount is negative', () => {
      createStandardBudget();
      const budgetId = getFirstBudgetId();

      expect(() => {
        useBudgetsStore.getState().closeBudgetPeriod({
          budgetId,
          spentAmount: -100,
          remainingAmount: 2100,
          rolloverOption: { type: 'discard' },
          periodFrom: '2026-07-01',
          periodTo: '2026-07-31',
          nextPeriod: { type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' },
        });
      }).toThrow('spentAmount must be a non-negative finite number');
    });
  });
});
