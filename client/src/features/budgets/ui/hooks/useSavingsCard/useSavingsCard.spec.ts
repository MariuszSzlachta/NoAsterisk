import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import type { PeriodHistoryRecord } from '#features/budgets/model/types/period-history-record';
import { useSavingsCard } from './useSavingsCard';

describe('useSavingsCard', () => {
  beforeEach(() => {
    useBudgetsStore.setState({ budgets: [] });
    usePeriodHistoryStore.setState({ history: [] });
  });

  it('returns null vm when budget not found', () => {
    const { result } = renderHook(() => useSavingsCard({ budgetId: 'non-existent' }));

    expect(result.current.vm).toBeNull();
    expect(result.current.inflowHistory).toHaveLength(0);
  });

  it('returns vm with accumulated balance from rollovers', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Savings',
      budgetType: 'savings',
      color: '#10b981',
      limitAmount: 10000,
      limitCurrency: 'PLN',
      period: null,
    });
    const savingsId = useBudgetsStore.getState().budgets[0].id;

    // Add a source budget
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Groceries',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 2000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    const sourceId = useBudgetsStore.getState().budgets[1].id;

    const historyRecord: PeriodHistoryRecord = {
      id: 'ph-1',
      budgetId: sourceId,
      periodFrom: '2026-07-01',
      periodTo: '2026-07-31',
      limitAmount: 2000,
      spentAmount: 1500,
      remainingAmount: 500,
      closedAt: '2026-08-01T10:00:00.000Z',
      rollover: { amount: 500, targetType: 'savings_budget', targetBudgetId: savingsId },
    };
    usePeriodHistoryStore.setState({ history: [historyRecord] });

    const { result } = renderHook(() => useSavingsCard({ budgetId: savingsId }));

    expect(result.current.vm).not.toBeNull();
    expect(result.current.vm.accumulated).toBe(500);
    expect(result.current.vm.goalAmount).toBe(10000);
    expect(result.current.vm.progressPercent).toBe(5);
  });

  it('returns inflow history with source budget name', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Savings',
      budgetType: 'savings',
      color: '#10b981',
      limitAmount: 10000,
      limitCurrency: 'PLN',
      period: null,
    });
    const savingsId = useBudgetsStore.getState().budgets[0].id;

    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Groceries',
      budgetType: 'standard',
      color: '#000',
      limitAmount: 2000,
      limitCurrency: 'PLN',
      period: { type: 'monthly' },
    });
    const sourceId = useBudgetsStore.getState().budgets[1].id;

    usePeriodHistoryStore.setState({
      history: [{
        id: 'ph-1',
        budgetId: sourceId,
        periodFrom: '2026-07-01',
        periodTo: '2026-07-31',
        limitAmount: 2000,
        spentAmount: 1500,
        remainingAmount: 500,
        closedAt: '2026-08-01T10:00:00.000Z',
        rollover: { amount: 500, targetType: 'savings_budget', targetBudgetId: savingsId },
      }],
    });

    const { result } = renderHook(() => useSavingsCard({ budgetId: savingsId }));

    expect(result.current.inflowHistory).toHaveLength(1);
    expect(result.current.inflowHistory[0]?.sourceBudgetName).toBe('Groceries');
    expect(result.current.inflowHistory[0]?.amount).toBe(500);
  });

  it('toggles history expansion', () => {
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Savings',
      budgetType: 'savings',
      color: '#10b981',
      limitAmount: 10000,
      limitCurrency: 'PLN',
      period: null,
    });
    const savingsId = useBudgetsStore.getState().budgets[0].id;

    const { result } = renderHook(() => useSavingsCard({ budgetId: savingsId }));

    expect(result.current.isHistoryExpanded).toBe(false);

    act(() => {
      result.current.handleToggleHistory();
    });

    expect(result.current.isHistoryExpanded).toBe(true);

    act(() => {
      result.current.handleToggleHistory();
    });

    expect(result.current.isHistoryExpanded).toBe(false);
  });
});
