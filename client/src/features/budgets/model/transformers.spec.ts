import { describe, it, expect } from 'vitest';

import { mapBudgetRecordToViewModel, mapSavingsBudgetToViewModel, computeNextPeriod } from './transformers';
import type { PeriodHistoryRecord } from './period-history';
import type { BudgetRecord, BudgetTransactionInput } from './types';

const buildBudgetRecord = (overrides?: Partial<BudgetRecord>): BudgetRecord => ({
  id: 'budget-1',
  workspaceId: 'ws-1',
  budgetType: 'standard',
  name: 'Zakupy spożywcze',
  color: '#34d399',
  limitAmount: 2000,
  limitCurrency: 'PLN',
  period: { type: 'monthly' },
  categoryIds: ['cat-1'],
  createdAt: '2026-06-01T00:00:00.000Z',
  isArchived: false,
  ...overrides,
});

const buildTransaction = (overrides?: Partial<BudgetTransactionInput>): BudgetTransactionInput => ({
  id: 'tx-1',
  date: '2026-06-15',
  description: 'BIEDRONKA',
  amount: -150,
  currency: 'PLN',
  budgetId: 'budget-1',
  ...overrides,
});

describe('mapBudgetRecordToViewModel', () => {
  const now = new Date('2026-06-15T12:00:00.000Z');

  it('maps basic budget with one transaction', () => {
    const budget = buildBudgetRecord();
    const transactions = [buildTransaction({ amount: -150 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.id).toBe('budget-1');
    expect(vm.name).toBe('Zakupy spożywcze');
    expect(vm.color).toBe('#34d399');
    expect(vm.limit).toBe(2000);
    expect(vm.currency).toBe('PLN');
    expect(vm.spent).toBe(150);
    expect(vm.remaining).toBe(1850);
    expect(vm.transactions).toHaveLength(1);
  });

  it('computes progressPercent correctly', () => {
    const budget = buildBudgetRecord({ limitAmount: 1000 });
    const transactions = [
      buildTransaction({ id: 'tx-1', amount: -300 }),
      buildTransaction({ id: 'tx-2', amount: -200 }),
    ];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.progressPercent).toBe(50); // 500/1000 = 50%
  });

  it('computes negative remaining when over budget', () => {
    const budget = buildBudgetRecord({ limitAmount: 100 });
    const transactions = [buildTransaction({ amount: -250 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.remaining).toBe(-150);
    expect(vm.status).toBe('overBudget');
    expect(vm.statusLabel).toBe('overBudget');
  });

  it('returns newPeriod status when no transactions', () => {
    const budget = buildBudgetRecord();

    const vm = mapBudgetRecordToViewModel(budget, [], now);

    expect(vm.status).toBe('newPeriod');
    expect(vm.statusLabel).toBe('newPeriod');
    expect(vm.spent).toBe(0);
    expect(vm.remaining).toBe(2000);
    expect(vm.transactions).toHaveLength(0);
  });

  it('filters transactions by budgetId', () => {
    const budget = buildBudgetRecord({ id: 'budget-1' });
    const transactions = [
      buildTransaction({ id: 'tx-1', budgetId: 'budget-1', amount: -100 }),
      buildTransaction({ id: 'tx-2', budgetId: 'budget-2', amount: -500 }),
      buildTransaction({ id: 'tx-3', budgetId: undefined, amount: -300 }),
    ];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.spent).toBe(100);
    expect(vm.transactions).toHaveLength(1);
  });

  it('filters transactions by period date range', () => {
    const budget = buildBudgetRecord({ period: { type: 'monthly' } });
    const transactions = [
      buildTransaction({ id: 'tx-in', date: '2026-06-10', amount: -200 }),
      buildTransaction({ id: 'tx-out', date: '2026-05-15', amount: -500 }),
    ];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.spent).toBe(200);
    expect(vm.transactions).toHaveLength(1);
  });

  it('computes daysRemaining for monthly budget', () => {
    const budget = buildBudgetRecord({ period: { type: 'monthly' } });

    const vm = mapBudgetRecordToViewModel(budget, [], now);

    // June 15 → June 30 = 15 days remaining
    expect(vm.daysRemaining).toBe(15);
  });

  it('generates periodLabel with day range and month', () => {
    const budget = buildBudgetRecord({ period: { type: 'monthly' } });

    const vm = mapBudgetRecordToViewModel(budget, [], now);

    // "1–30 Jun" (English short month from date-fns default locale)
    expect(vm.periodLabel).toContain('1');
    expect(vm.periodLabel).toContain('30');
    expect(vm.periodLabel).toContain('Jun');
  });

  it('computes spentPercent and timePercent', () => {
    const budget = buildBudgetRecord({ limitAmount: 2000 });
    const transactions = [buildTransaction({ amount: -1000 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    // 50% spent, ~47% time (14/30 days elapsed)
    expect(vm.spentPercent).toBe(50);
    expect(vm.timePercent).toBeGreaterThan(0);
    expect(vm.timePercent).toBeLessThanOrEqual(100);
  });

  it('handles custom period', () => {
    const budget = buildBudgetRecord({
      period: { type: 'custom', dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    });
    const transactions = [buildTransaction({ date: '2026-06-10', amount: -300 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.spent).toBe(300);
    expect(vm.periodLabel).toContain('1');
    expect(vm.periodLabel).toContain('30');
  });

  it('handles yearly period', () => {
    const budget = buildBudgetRecord({ period: { type: 'yearly' } });
    const transactions = [buildTransaction({ date: '2026-06-10', amount: -1000 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.spent).toBe(1000);
    expect(vm.periodLabel).toContain('1');
    expect(vm.periodLabel).toContain('Dec');
  });

  it('handles refunds — positive amounts reduce spent', () => {
    const budget = buildBudgetRecord();
    const transactions = [
      buildTransaction({ id: 'tx-1', amount: -150 }),
      buildTransaction({ id: 'tx-2', amount: 50 }), // refund
    ];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    // -(-150 + 50) = -(-100) = 100
    expect(vm.spent).toBe(100);
  });
});

describe('mapBudgetRecordToViewModel — awaitingClosure', () => {
  it('returns awaitingClosure when now > period end', () => {
    const budget = buildBudgetRecord({
      period: { type: 'custom', dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    });
    // now is July 15 — past the period end
    const now = new Date('2026-07-15T12:00:00.000Z');
    const transactions = [buildTransaction({ date: '2026-06-10', amount: -500 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.status).toBe('awaitingClosure');
  });

  it('does not return awaitingClosure when now is within period', () => {
    const budget = buildBudgetRecord({
      period: { type: 'custom', dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    });
    const now = new Date('2026-06-15T12:00:00.000Z');
    const transactions = [buildTransaction({ date: '2026-06-10', amount: -500 })];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now);

    expect(vm.status).not.toBe('awaitingClosure');
  });

  it('does not return awaitingClosure when period is already closed in history', () => {
    const budget = buildBudgetRecord({
      period: { type: 'custom', dateFrom: '2026-06-01', dateTo: '2026-06-30' },
    });
    const now = new Date('2026-07-15T12:00:00.000Z');
    const transactions = [buildTransaction({ date: '2026-06-10', amount: -500 })];
    const history: readonly PeriodHistoryRecord[] = [{
      id: 'ph-1',
      budgetId: 'budget-1',
      periodFrom: '2026-06-01',
      periodTo: '2026-06-30',
      limitAmount: 2000,
      spentAmount: 500,
      remainingAmount: 1500,
      closedAt: '2026-07-01T10:00:00.000Z',
      rollover: null,
    }];

    const vm = mapBudgetRecordToViewModel(budget, transactions, now, history);

    expect(vm.status).not.toBe('awaitingClosure');
  });

  it('throws when called on savings budget (period: null)', () => {
    const budget = buildBudgetRecord({ period: null, budgetType: 'savings' });
    const now = new Date('2026-06-15T12:00:00.000Z');

    expect(() => mapBudgetRecordToViewModel(budget, [], now)).toThrow(/savings budget/);
  });
});

describe('mapSavingsBudgetToViewModel', () => {
  const savingsBudget = buildBudgetRecord({
    id: 'savings-1',
    budgetType: 'savings',
    name: 'Fundusz awaryjny',
    color: '#10b981',
    limitAmount: 10000,
    period: null,
  });

  const allBudgets = [
    buildBudgetRecord({ id: 'budget-groceries', name: 'Zakupy spożywcze' }),
    savingsBudget,
  ];

  it('computes accumulated balance from period history rollovers', () => {
    const history: readonly PeriodHistoryRecord[] = [
      {
        id: 'ph-1',
        budgetId: 'budget-groceries',
        periodFrom: '2026-06-01',
        periodTo: '2026-06-30',
        limitAmount: 2500,
        spentAmount: 1800,
        remainingAmount: 700,
        closedAt: '2026-07-01T10:00:00.000Z',
        rollover: { amount: 700, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      },
    ];

    const vm = mapSavingsBudgetToViewModel(savingsBudget, history, allBudgets);

    expect(vm.accumulated).toBe(700);
    expect(vm.goalAmount).toBe(10000);
    expect(vm.progressPercent).toBe(7);
    expect(vm.lastInflow).toEqual({
      id: 'ph-1',
      amount: 700,
      sourceBudgetName: 'Zakupy spożywcze',
      date: '2026-07-01T10:00:00.000Z',
    });
  });

  it('returns 0 accumulated and null lastInflow when no history', () => {
    const vm = mapSavingsBudgetToViewModel(savingsBudget, [], allBudgets);

    expect(vm.accumulated).toBe(0);
    expect(vm.progressPercent).toBe(0);
    expect(vm.lastInflow).toBeNull();
  });

  it('returns 0 progressPercent when goalAmount is 0 (no goal)', () => {
    const noGoalBudget = { ...savingsBudget, limitAmount: 0 };

    const vm = mapSavingsBudgetToViewModel(noGoalBudget, [], allBudgets);

    expect(vm.progressPercent).toBe(0);
  });

  it('caps progressPercent at 100 when accumulated exceeds goal', () => {
    const history: readonly PeriodHistoryRecord[] = [
      {
        id: 'ph-1',
        budgetId: 'budget-groceries',
        periodFrom: '2026-06-01',
        periodTo: '2026-06-30',
        limitAmount: 2500,
        spentAmount: 0,
        remainingAmount: 2500,
        closedAt: '2026-07-01T10:00:00.000Z',
        rollover: { amount: 15000, targetType: 'savings_budget', targetBudgetId: 'savings-1' },
      },
    ];

    const vm = mapSavingsBudgetToViewModel(savingsBudget, history, allBudgets);

    expect(vm.accumulated).toBe(15000);
    expect(vm.progressPercent).toBe(100);
  });

  it('maps basic fields from budget record', () => {
    const vm = mapSavingsBudgetToViewModel(savingsBudget, [], allBudgets);

    expect(vm.id).toBe('savings-1');
    expect(vm.name).toBe('Fundusz awaryjny');
    expect(vm.color).toBe('#10b981');
    expect(vm.currency).toBe('PLN');
  });
});

describe('computeNextPeriod', () => {
  it('returns monthly unchanged', () => {
    expect(computeNextPeriod({ type: 'monthly' })).toEqual({ type: 'monthly' });
  });

  it('returns yearly unchanged', () => {
    expect(computeNextPeriod({ type: 'yearly' })).toEqual({ type: 'yearly' });
  });

  it('computes next custom period starting day after current end with same duration', () => {
    const result = computeNextPeriod({ type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' });

    expect(result).toEqual({ type: 'custom', dateFrom: '2026-08-01', dateTo: '2026-08-31' });
  });

  it('handles custom period spanning month boundary', () => {
    const result = computeNextPeriod({ type: 'custom', dateFrom: '2026-06-15', dateTo: '2026-07-14' });

    expect(result).toEqual({ type: 'custom', dateFrom: '2026-07-15', dateTo: '2026-08-13' });
  });
});
