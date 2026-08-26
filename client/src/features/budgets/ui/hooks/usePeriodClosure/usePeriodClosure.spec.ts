import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { usePeriodHistoryStore } from '#features/budgets/store/usePeriodHistoryStore';
import type { BudgetViewModel } from '#features/budgets/model/types';
import { usePeriodClosure } from './usePeriodClosure';

// ─── Helpers ─────────────────────────────────────────────────────

const buildVM = (overrides?: Partial<BudgetViewModel>): BudgetViewModel => ({
  id: 'budget-1',
  name: 'Groceries',
  color: '#34d399',
  status: 'awaitingClosure',
  statusLabel: 'awaitingClosure',
  periodLabel: '1–31 Jul',
  daysRemaining: 0,
  spent: 1500,
  limit: 2000,
  remaining: 500,
  currency: 'PLN',
  progressPercent: 75,
  spentPercent: 75,
  timePercent: 100,
  transactions: [],
  ...overrides,
});

describe('usePeriodClosure', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    useBudgetsStore.setState({ budgets: [] });
    usePeriodHistoryStore.setState({ history: [] });
    mockOnClose.mockReset();

    // Seed a standard budget
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Groceries',
      budgetType: 'standard',
      color: '#34d399',
      limitAmount: 2000,
      limitCurrency: 'PLN',
      period: { type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' },
    });
  });

  const getBudgetId = (): string => useBudgetsStore.getState().budgets[0]!.id;

  it('initializes with carry_forward when remaining > 0', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId, remaining: 500 });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    expect(result.current.selectedOption).toBe('carry_forward');
    expect(result.current.hasSurplus).toBe(true);
  });

  it('initializes with discard when remaining <= 0', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId, remaining: 0 });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    expect(result.current.selectedOption).toBe('discard');
    expect(result.current.hasSurplus).toBe(false);
  });

  it('handleOptionChange switches option', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleOptionChange('savings');
    });

    expect(result.current.selectedOption).toBe('savings');
  });

  it('isSubmitDisabled when savings selected but no target', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleOptionChange('savings');
    });

    expect(result.current.isSubmitDisabled).toBe(true);
  });

  it('isSubmitDisabled is false for carry_forward', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it('handleSavingsSelect sets target id', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleOptionChange('savings');
      result.current.handleSavingsSelect('savings-123');
    });

    expect(result.current.selectedSavingsBudgetId).toBe('savings-123');
    expect(result.current.isSubmitDisabled).toBe(false);
  });

  it('handleSubmit closes period and calls onClose', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockOnClose).toHaveBeenCalledOnce();
    const history = usePeriodHistoryStore.getState().history;
    expect(history).toHaveLength(1);
    expect(history[0]?.rollover?.targetType).toBe('same_budget');
  });

  it('handleSubmit does nothing when savings target is empty', () => {
    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    act(() => {
      result.current.handleOptionChange('savings');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
    expect(usePeriodHistoryStore.getState().history).toHaveLength(0);
  });

  it('shows savings budgets in options', () => {
    // Add a savings budget
    useBudgetsStore.getState().createBudget({
      workspaceId: 'ws-1',
      name: 'Holiday Fund',
      budgetType: 'savings',
      color: '#10b981',
      limitAmount: 5000,
      limitCurrency: 'PLN',
      period: null,
    });

    const budgetId = getBudgetId();
    const vm = buildVM({ id: budgetId });

    const { result } = renderHook(() =>
      usePeriodClosure({ budgetId, vm, onClose: mockOnClose }),
    );

    expect(result.current.savingsBudgetOptions).toHaveLength(1);
    expect(result.current.savingsBudgetOptions[0]?.label).toBe('Holiday Fund');
    expect(result.current.hasSavingsBudgets).toBe(true);
  });
});
