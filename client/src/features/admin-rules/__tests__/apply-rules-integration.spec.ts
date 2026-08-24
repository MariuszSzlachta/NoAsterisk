import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRulesStore } from '#features/admin-rules/store/useRulesStore';

import { useApplyRules } from '#features/admin-rules/ui/hooks/useApplyRules';

// ─── Mock Transactions Store ─────────────────────────────────────

const mockTransactions = [
  { id: 'tx-1', description: 'BIEDRONKA KRAKOWSKA', categoryId: undefined },
  { id: 'tx-2', description: 'UBER TRIP WARSAW', categoryId: undefined },
  { id: 'tx-3', description: 'NETFLIX SUBSCRIPTION', categoryId: undefined },
  { id: 'tx-4', description: 'ALREADY CATEGORIZED', categoryId: 'cat-existing' },
];

const mockBulkUpdateCategory = vi.fn();

vi.mock('#features/transactions', () => ({
  useTransactionsStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      transactions: mockTransactions,
      bulkUpdateCategory: mockBulkUpdateCategory,
    }),
}));

// ─── Integration Tests ───────────────────────────────────────────

describe('useApplyRules — integration with real rules store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset rules store
    useRulesStore.setState({ rules: [] });
  });

  it('categorizes transactions matching rules from the store', () => {
    // Setup: add rules to the real zustand store
    act(() => {
      useRulesStore.setState({
        rules: [
          {
            id: 'rule-1',
            keyword: 'BIEDRONKA',
            matcherType: 'Contains',
            categoryId: 'cat-groceries',
            priority: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'rule-2',
            keyword: 'UBER',
            matcherType: 'Contains',
            categoryId: 'cat-transport',
            priority: 2,
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      });
    });

    const { result } = renderHook(() => useApplyRules());

    // Act: apply rules
    act(() => {
      result.current.handleApplyRules();
    });

    // Assert: bulkUpdateCategory called for each category group
    expect(mockBulkUpdateCategory).toHaveBeenCalledTimes(2);
    expect(mockBulkUpdateCategory).toHaveBeenCalledWith(['tx-1'], 'cat-groceries');
    expect(mockBulkUpdateCategory).toHaveBeenCalledWith(['tx-2'], 'cat-transport');

    // Assert: result reflects categorized count
    expect(result.current.lastResult).toEqual({
      categorized: 2,
      total: 3, // only 3 uncategorized (tx-4 already has category)
    });
  });

  it('returns zero categorized when no rules match', () => {
    act(() => {
      useRulesStore.setState({
        rules: [
          {
            id: 'rule-1',
            keyword: 'LIDL',
            matcherType: 'Contains',
            categoryId: 'cat-groceries',
            priority: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      });
    });

    const { result } = renderHook(() => useApplyRules());

    act(() => {
      result.current.handleApplyRules();
    });

    expect(mockBulkUpdateCategory).not.toHaveBeenCalled();
    expect(result.current.lastResult).toEqual({
      categorized: 0,
      total: 3,
    });
  });

  it('does nothing when no rules exist', () => {
    const { result } = renderHook(() => useApplyRules());

    act(() => {
      result.current.handleApplyRules();
    });

    expect(mockBulkUpdateCategory).not.toHaveBeenCalled();
    expect(result.current.lastResult).toEqual({
      categorized: 0,
      total: 3,
    });
  });

  it('groups multiple matching transactions per category', () => {
    act(() => {
      useRulesStore.setState({
        rules: [
          {
            id: 'rule-1',
            keyword: 'BIEDRONKA',
            matcherType: 'Contains',
            categoryId: 'cat-groceries',
            priority: 10,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'rule-2',
            keyword: 'UBER',
            matcherType: 'Contains',
            categoryId: 'cat-groceries', // same category as rule-1!
            priority: 5,
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      });
    });

    const { result } = renderHook(() => useApplyRules());

    act(() => {
      result.current.handleApplyRules();
    });

    // Both tx-1 and tx-2 should map to cat-groceries → single bulk call
    expect(mockBulkUpdateCategory).toHaveBeenCalledTimes(1);
    expect(mockBulkUpdateCategory).toHaveBeenCalledWith(
      expect.arrayContaining(['tx-1', 'tx-2']),
      'cat-groceries',
    );
  });

  it('higher priority rule wins when multiple rules match same transaction', () => {
    act(() => {
      useRulesStore.setState({
        rules: [
          {
            id: 'rule-low',
            keyword: 'BIEDRONKA',
            matcherType: 'Contains',
            categoryId: 'cat-other',
            priority: 1,
            createdAt: '2026-01-01T00:00:00.000Z',
          },
          {
            id: 'rule-high',
            keyword: 'BIEDRONKA',
            matcherType: 'Contains',
            categoryId: 'cat-groceries',
            priority: 10,
            createdAt: '2026-01-02T00:00:00.000Z',
          },
        ],
      });
    });

    const { result } = renderHook(() => useApplyRules());

    act(() => {
      result.current.handleApplyRules();
    });

    // Only cat-groceries (high priority) should win for tx-1
    expect(mockBulkUpdateCategory).toHaveBeenCalledWith(['tx-1'], 'cat-groceries');
    expect(mockBulkUpdateCategory).not.toHaveBeenCalledWith(
      expect.anything(),
      'cat-other',
    );
  });
});
