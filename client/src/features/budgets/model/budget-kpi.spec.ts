import { describe, it, expect } from 'vitest';

import { computeBudgetKpis } from './budget-kpi';
import type { BudgetViewModel } from './types';

const buildBudgetVM = (overrides?: Partial<BudgetViewModel>): BudgetViewModel => ({
  id: 'budget-1',
  name: 'Test',
  color: '#34d399',
  status: 'onTrack',
  statusLabel: 'onTrack',
  periodLabel: '1–30 Jun',
  daysRemaining: 15,
  spent: 500,
  limit: 2000,
  remaining: 1500,
  currency: 'PLN',
  progressPercent: 25,
  spentPercent: 25,
  timePercent: 50,
  transactions: [],
  ...overrides,
});

describe('computeBudgetKpis', () => {
  it('sums totals from multiple budgets', () => {
    const budgets = [
      buildBudgetVM({ limit: 2000, spent: 500 }),
      buildBudgetVM({ id: 'budget-2', limit: 3000, spent: 1500 }),
      buildBudgetVM({ id: 'budget-3', limit: 1000, spent: 800 }),
    ];

    const kpi = computeBudgetKpis(budgets, 'PLN');

    expect(kpi.totalPlanned).toBe(6000);
    expect(kpi.totalSpent).toBe(2800);
    expect(kpi.totalRemaining).toBe(3200);
  });

  it('counts budgets needing attention (overBudget + warning)', () => {
    const budgets = [
      buildBudgetVM({ id: 'b1', status: 'overBudget' }),
      buildBudgetVM({ id: 'b2', status: 'warning' }),
      buildBudgetVM({ id: 'b3', status: 'onTrack' }),
      buildBudgetVM({ id: 'b4', status: 'surplus' }),
      buildBudgetVM({ id: 'b5', status: 'newPeriod' }),
    ];

    const kpi = computeBudgetKpis(budgets, 'PLN');

    expect(kpi.needsAttentionCount).toBe(2);
  });

  it('returns defaultCurrency when no budgets', () => {
    const kpi = computeBudgetKpis([], 'PLN');

    expect(kpi.currency).toBe('PLN');
    expect(kpi.totalPlanned).toBe(0);
    expect(kpi.totalSpent).toBe(0);
    expect(kpi.totalRemaining).toBe(0);
    expect(kpi.needsAttentionCount).toBe(0);
  });

  it('takes currency from first budget', () => {
    const budgets = [buildBudgetVM({ currency: 'EUR' })];

    const kpi = computeBudgetKpis(budgets, 'PLN');

    expect(kpi.currency).toBe('EUR');
  });

  it('throws on mixed currencies', () => {
    const budgets = [
      buildBudgetVM({ id: 'b1', currency: 'PLN' }),
      buildBudgetVM({ id: 'b2', currency: 'EUR' }),
    ];

    expect(() => computeBudgetKpis(budgets, 'PLN')).toThrow('mixed currencies');
  });
});
