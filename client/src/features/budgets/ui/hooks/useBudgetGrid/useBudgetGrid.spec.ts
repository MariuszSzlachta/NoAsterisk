import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';

vi.mock('#features/transactions', () => ({
  useTransactionsStore: vi.fn((selector: (s: { transactions: unknown[] }) => unknown) =>
    selector({ transactions: [] }),
  ),
}));

import { useBudgetGrid } from './useBudgetGrid';

describe('useBudgetGrid', () => {
  beforeEach(() => {
    useBudgetsStore.setState({ budgets: [] });
    usePeriodHistoryStore.setState({ history: [] });
  });

  it('returns isEmpty when no budgets exist', () => {
    const { result } = renderHook(() => useBudgetGrid('all', 'monthly'));

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.budgets).toHaveLength(0);
  });

  it('returns monthly budgets when period filter is monthly', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Monthly Budget',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 1000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Yearly Budget',
      budgetType: 'standard',
      color: '#111',
      limitAmount: 5000,
      limitCurrency: 'PLN',
      period: { type: 'yearly' },
    });

    const { result } = renderHook(() => useBudgetGrid('all', 'monthly'));

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0]?.name).toBe('Monthly Budget');
  });

  it('returns yearly budgets when period filter is yearly', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Yearly Budget',
      budgetType: 'standard',
      color: '#111',
      limitAmount: 5000,
      limitCurrency: 'PLN',
      period: { type: 'yearly' },
    });

    const { result } = renderHook(() => useBudgetGrid('all', 'yearly'));

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0]?.name).toBe('Yearly Budget');
  });

  it('returns empty for savings filter (savings are shown separately)', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Monthly',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 1000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });

    const { result } = renderHook(() => useBudgetGrid('all', 'savings'));

    expect(result.current.isEmpty).toBe(true);
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
      limitAmount: 2000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    const archivedId = useBudgetsStore.getState().budgets[1].id;
    useBudgetsStore.getState().archiveBudget(archivedId);

    const { result } = renderHook(() => useBudgetGrid('all', 'monthly'));

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0]?.name).toBe('Active');
  });

  it('excludes savings budgets from grid', () => {
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

    const { result } = renderHook(() => useBudgetGrid('all', 'monthly'));

    expect(result.current.budgets).toHaveLength(1);
    expect(result.current.budgets[0]?.name).toBe('Standard');
  });

  it('filters by needsAttention tab — only overBudget and warning', () => {
    // Create a budget with 0 transactions → newPeriod status
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'New',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 1000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });

    const { result } = renderHook(() => useBudgetGrid('needsAttention', 'monthly'));

    // newPeriod doesn't need attention
    expect(result.current.budgets).toHaveLength(0);
  });
});
