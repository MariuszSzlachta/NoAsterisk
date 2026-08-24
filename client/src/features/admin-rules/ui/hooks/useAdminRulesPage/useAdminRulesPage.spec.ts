import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRuleFormStore } from '#features/admin-rules/store/useRuleFormStore';

import { useAdminRulesPage } from './useAdminRulesPage';

// ─── Mocks ───────────────────────────────────────────────────────

const STUB_RULES = [
  {
    id: 'rule-1',
    keyword: 'BIEDRONKA',
    matcherType: 'Contains' as const,
    categoryId: 'cat-groceries',
    priority: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'rule-2',
    keyword: 'UBER',
    matcherType: 'Contains' as const,
    categoryId: 'cat-transport',
    priority: 2,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

vi.mock('#features/admin-rules/store/useRulesStore', () => ({
  useRulesStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ rules: STUB_RULES }),
}));

vi.mock('#features/admin-rules/ui/hooks/useApplyRules', () => ({
  useApplyRules: () => ({
    handleApplyRules: vi.fn(),
    lastResult: undefined,
  }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useAdminRulesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the real form store between tests
    useRuleFormStore.setState({
      showForm: false,
      editingRuleId: undefined,
    });
  });

  it('starts with form hidden', () => {
    const { result } = renderHook(() => useAdminRulesPage());

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingRule).toBeUndefined();
  });

  it('opens add form (no editing rule)', () => {
    const { result } = renderHook(() => useAdminRulesPage());

    act(() => {
      result.current.handleAddRule();
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingRule).toBeUndefined();
  });

  it('opens edit form with matching rule', () => {
    const { result } = renderHook(() => useAdminRulesPage());

    act(() => {
      result.current.handleEditRule('rule-2');
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingRule).toEqual(STUB_RULES[1]);
  });

  it('returns undefined editingRule for non-existent id', () => {
    const { result } = renderHook(() => useAdminRulesPage());

    act(() => {
      result.current.handleEditRule('non-existent');
    });

    expect(result.current.showForm).toBe(true);
    expect(result.current.editingRule).toBeUndefined();
  });

  it('closes form and clears editing state', () => {
    const { result } = renderHook(() => useAdminRulesPage());

    act(() => {
      result.current.handleEditRule('rule-1');
    });
    act(() => {
      result.current.handleCloseForm();
    });

    expect(result.current.showForm).toBe(false);
    expect(result.current.editingRule).toBeUndefined();
  });

  it('lastResult starts as undefined', () => {
    const { result } = renderHook(() => useAdminRulesPage());

    expect(result.current.lastResult).toBeUndefined();
  });
});
