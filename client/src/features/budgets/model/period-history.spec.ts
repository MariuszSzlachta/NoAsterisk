import { describe, it, expect } from 'vitest';

import type { BudgetRecord } from './types';
import type { PeriodHistoryRecord } from './period-history';
import { computeSavingsBalance, getLastInflow, getInflowHistory } from './period-history';

// ─── Test Builders ───────────────────────────────────────────────

const buildPeriodHistory = (overrides?: Partial<PeriodHistoryRecord>): PeriodHistoryRecord => ({
  id: 'ph-1',
  budgetId: 'budget-groceries',
  periodFrom: '2026-07-01',
  periodTo: '2026-07-31',
  limitAmount: 2500,
  spentAmount: 1800,
  remainingAmount: 700,
  closedAt: '2026-08-01T10:00:00.000Z',
  rollover: null,
  ...overrides,
});

const buildBudgetRecord = (overrides?: Partial<BudgetRecord>): BudgetRecord => ({
  id: 'budget-groceries',
  workspaceId: 'ws-1',
  budgetType: 'standard',
  name: 'Zakupy spożywcze',
  color: '#34d399',
  limitAmount: 2500,
  limitCurrency: 'PLN',
  period: { type: 'monthly' },
  categoryIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  isArchived: false,
  ...overrides,
});

// ─── computeSavingsBalance ───────────────────────────────────────

describe('computeSavingsBalance', () => {
  it('returns 0 when no history exists', () => {
    expect(computeSavingsBalance('savings-1', [])).toBe(0);
  });

  it('returns 0 when no rollovers target the savings budget', () => {
    const history = [
      buildPeriodHistory({
        rollover: { amount: 500, targetType: 'same_budget', targetBudgetId: 'budget-groceries' },
      }),
    ];

    expect(computeSavingsBalance('savings-1', history)).toBe(0);
  });

  it('sums rollovers targeting the savings budget', () => {
    const history = [
      buildPeriodHistory({
        id: 'ph-1',
        rollover: { amount: 700, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-2',
        budgetId: 'budget-transport',
        rollover: { amount: 300, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
    ];

    expect(computeSavingsBalance('savings-1', history)).toBe(1000);
  });

  it('ignores rollovers targeting a different savings budget', () => {
    const history = [
      buildPeriodHistory({
        rollover: { amount: 700, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-2',
        rollover: { amount: 400, targetType: 'savings_budget', targetBudgetId: 'savings-2' },
      }),
    ];

    expect(computeSavingsBalance('savings-1', history)).toBe(700);
  });

  it('ignores records with null rollover', () => {
    const history = [
      buildPeriodHistory({ rollover: null }),
      buildPeriodHistory({
        id: 'ph-2',
        rollover: { amount: 500, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
    ];

    expect(computeSavingsBalance('savings-1', history)).toBe(500);
  });

  it('handles negative rollover amounts (withdrawal/correction)', () => {
    const history = [
      buildPeriodHistory({
        id: 'ph-1',
        rollover: { amount: 700, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-2',
        rollover: { amount: -200, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
    ];

    // Negative amounts reduce the balance (e.g., correction or future withdrawal)
    expect(computeSavingsBalance('savings-1', history)).toBe(500);
  });
});

// ─── getLastInflow ───────────────────────────────────────────────

describe('getLastInflow', () => {
  const budgets = [
    buildBudgetRecord({ id: 'budget-groceries', name: 'Zakupy spożywcze' }),
    buildBudgetRecord({ id: 'budget-transport', name: 'Transport' }),
  ];

  it('returns null when no history exists', () => {
    expect(getLastInflow('savings-1', [], budgets)).toBeNull();
  });

  it('returns null when no rollovers target the savings budget', () => {
    const history = [
      buildPeriodHistory({
        rollover: { amount: 500, targetType: 'same_budget', targetBudgetId: 'budget-groceries' },
      }),
    ];

    expect(getLastInflow('savings-1', history, budgets)).toBeNull();
  });

  it('returns the most recent inflow', () => {
    const history = [
      buildPeriodHistory({
        id: 'ph-1',
        budgetId: 'budget-groceries',
        closedAt: '2026-07-01T10:00:00.000Z',
        rollover: { amount: 500, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-2',
        budgetId: 'budget-transport',
        closedAt: '2026-08-01T10:00:00.000Z',
        rollover: { amount: 300, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
    ];

    const result = getLastInflow('savings-1', history, budgets);

    expect(result).toEqual({
      id: 'ph-2',
      amount: 300,
      sourceBudgetName: 'Transport',
      date: '2026-08-01T10:00:00.000Z',
    });
  });

  it('returns empty sourceBudgetName when source budget not found', () => {
    const history = [
      buildPeriodHistory({
        budgetId: 'budget-deleted',
        rollover: { amount: 200, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
    ];

    const result = getLastInflow('savings-1', history, budgets);

    expect(result).toEqual({
      id: 'ph-1',
      amount: 200,
      sourceBudgetName: undefined,
      date: '2026-08-01T10:00:00.000Z',
    });
  });
});

// ─── getInflowHistory ────────────────────────────────────────────

describe('getInflowHistory', () => {
  const budgets = [
    buildBudgetRecord({ id: 'budget-groceries', name: 'Zakupy spożywcze' }),
    buildBudgetRecord({ id: 'budget-transport', name: 'Transport' }),
  ];

  it('returns empty array when no history exists', () => {
    expect(getInflowHistory('savings-1', [], budgets)).toEqual([]);
  });

  it('returns all inflows sorted newest-first', () => {
    const history = [
      buildPeriodHistory({
        id: 'ph-1',
        budgetId: 'budget-groceries',
        closedAt: '2026-06-01T10:00:00.000Z',
        rollover: { amount: 400, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-2',
        budgetId: 'budget-transport',
        closedAt: '2026-08-01T10:00:00.000Z',
        rollover: { amount: 300, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-3',
        budgetId: 'budget-groceries',
        closedAt: '2026-07-01T10:00:00.000Z',
        rollover: { amount: 500, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
    ];

    const result = getInflowHistory('savings-1', history, budgets);

    expect(result).toEqual([
      { id: 'ph-2', amount: 300, sourceBudgetName: 'Transport', date: '2026-08-01T10:00:00.000Z' },
      { id: 'ph-3', amount: 500, sourceBudgetName: 'Zakupy spożywcze', date: '2026-07-01T10:00:00.000Z' },
      { id: 'ph-1', amount: 400, sourceBudgetName: 'Zakupy spożywcze', date: '2026-06-01T10:00:00.000Z' },
    ]);
  });

  it('filters out rollovers targeting other savings budgets', () => {
    const history = [
      buildPeriodHistory({
        id: 'ph-1',
        rollover: { amount: 700, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      }),
      buildPeriodHistory({
        id: 'ph-2',
        rollover: { amount: 400, targetType: 'savings_budget', targetBudgetId: 'savings-2' },
      }),
    ];

    const result = getInflowHistory('savings-1', history, budgets);

    expect(result).toHaveLength(1);
    expect(result[0]?.amount).toBe(700);
  });
});
