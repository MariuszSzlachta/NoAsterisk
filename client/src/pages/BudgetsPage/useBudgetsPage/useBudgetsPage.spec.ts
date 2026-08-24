import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetsPageStore } from '#features/budgets';

import { useBudgetsPage } from './useBudgetsPage';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_BUDGETS = [
  { id: 'b1', budgetType: 'monthly', isArchived: false, period: { start: '2026-08-01', end: '2026-08-31' } },
  { id: 'b2', budgetType: 'savings', isArchived: false },
  { id: 'b3', budgetType: 'savings', isArchived: true },
  { id: 'b4', budgetType: 'savings', isArchived: false },
];

vi.mock('#features/budgets', async () => {
  const actual = await vi.importActual('#features/budgets');
  return {
    ...actual,
    useBudgetsStore: (selector: (state: Record<string, unknown>) => unknown) =>
      selector({ budgets: MOCK_BUDGETS }),
    usePeriodHistoryStore: (selector: (state: Record<string, unknown>) => unknown) =>
      selector({ history: [] }),
    mapBudgetRecordToViewModel: vi.fn().mockReturnValue({ id: 'b1', name: 'Budget VM' }),
  };
});

vi.mock('#features/transactions', () => ({
  useTransactionsStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ transactions: [] }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useBudgetsPage', () => {
  beforeEach(() => {
    useBudgetsPageStore.setState({
      activeTab: 'all',
      selectedPeriod: 'monthly',
      customRange: undefined,
      isSavingsFormOpen: false,
      closingBudgetId: null,
    });
  });

  it('returns status tabs with translation keys', () => {
    const { result } = renderHook(() => useBudgetsPage());

    expect(result.current.statusTabs).toHaveLength(2);
    expect(result.current.statusTabs[0]).toEqual({ id: 'all', label: 'budgets.filters.all' });
    expect(result.current.statusTabs[1]).toEqual({ id: 'needsAttention', label: 'budgets.filters.needsAttention' });
  });

  it('filters savings budgets (non-archived only)', () => {
    const { result } = renderHook(() => useBudgetsPage());

    expect(result.current.savingsBudgets).toHaveLength(2);
    expect(result.current.savingsBudgets.map((b) => b.id)).toEqual(['b2', 'b4']);
  });

  it('handles tab change with valid filter tab', () => {
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handleTabChange('needsAttention'); });

    expect(result.current.activeTab).toBe('needsAttention');
  });

  it('ignores invalid tab values', () => {
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handleTabChange('invalid'); });

    expect(result.current.activeTab).toBe('all');
  });

  it('handles period change with valid period', () => {
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handlePeriodChange('yearly'); });

    expect(result.current.selectedPeriod).toBe('yearly');
  });

  it('ignores invalid period values', () => {
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handlePeriodChange('invalid'); });

    expect(result.current.selectedPeriod).toBe('monthly');
  });

  it('handles custom range change', () => {
    const range = { from: new Date('2026-01-01'), to: new Date('2026-01-31') };
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handleCustomRangeChange(range); });

    expect(result.current.customRange).toEqual(range);
  });

  it('opens and closes savings form', () => {
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handleOpenSavingsForm(); });
    expect(result.current.isSavingsFormOpen).toBe(true);

    act(() => { result.current.handleCloseSavingsForm(); });
    expect(result.current.isSavingsFormOpen).toBe(false);
  });

  it('opens and closes closure modal', () => {
    const { result } = renderHook(() => useBudgetsPage());

    act(() => { result.current.handleClosePeriod('b1'); });
    expect(result.current.closingBudgetId).toBe('b1');

    act(() => { result.current.handleCloseClosureModal(); });
    expect(result.current.closingBudgetId).toBeNull();
  });
});
