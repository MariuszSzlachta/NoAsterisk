import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';

vi.mock('#features/transactions', () => ({
  useTransactionsStore: vi.fn((selector: (s: { transactions: unknown[] }) => unknown) =>
    selector({ transactions: [] }),
  ),
}));

import { useBudgetKpi } from './useBudgetKpi';

describe('useBudgetKpi', () => {
  beforeEach(() => {
    useBudgetsStore.setState({ budgets: [] });
    usePeriodHistoryStore.setState({ history: [] });
  });

  it('returns zeroes when no budgets', () => {
    const { result } = renderHook(() => useBudgetKpi());

    expect(result.current.totalPlanned).toBe(0);
    expect(result.current.totalSpent).toBe(0);
    expect(result.current.totalRemaining).toBe(0);
    expect(result.current.needsAttentionCount).toBe(0);
    expect(result.current.currency).toBe('PLN');
  });

  it('computes KPIs from active standard budgets', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Budget A',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 2000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Budget B',
      budgetType: 'standard',
      color: '#111',
      limitAmount: 3000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });

    const { result } = renderHook(() => useBudgetKpi());

    expect(result.current.totalPlanned).toBe(5000);
    expect(result.current.currency).toBe('PLN');
  });

  it('excludes archived budgets', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Active',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 1000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Archived',
      budgetType: 'standard',
      color: '#111',
      limitAmount: 5000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    const archivedId = useBudgetsStore.getState().budgets[1]!.id;
    useBudgetsStore.getState().archiveBudget(archivedId);

    const { result } = renderHook(() => useBudgetKpi());

    expect(result.current.totalPlanned).toBe(1000);
  });

  it('excludes savings budgets', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Standard',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 1000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Savings',
      budgetType: 'savings',
      color: '#111',
      limitAmount: 10000,
      limitCurrency: 'PLN',
      period: null,
    });

    const { result } = renderHook(() => useBudgetKpi());

    expect(result.current.totalPlanned).toBe(1000);
  });
});
