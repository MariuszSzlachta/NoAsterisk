import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRulesStore } from '#features/admin-rules/store/useRulesStore';

import { useRulesTable } from './useRulesTable';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('#entities/category', () => ({
  STUB_CATEGORIES: [
    { id: 'cat-groceries', label: 'Spożywcze', color: '#4ade80' },
    { id: 'cat-transport', label: 'Transport', color: '#f59e0b' },
  ],
}));

// ─── Setup ───────────────────────────────────────────────────────

const SEED_RULES = [
  { id: 'r1', keyword: 'BIEDRONKA', matcherType: 'Contains' as const, categoryId: 'cat-groceries', priority: 1, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'r2', keyword: 'UBER', matcherType: 'Exact' as const, categoryId: 'cat-transport', priority: 5, createdAt: '2026-01-02T00:00:00.000Z' },
];

beforeEach(() => {
  useRulesStore.setState({ rules: SEED_RULES });
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useRulesTable', () => {
  it('maps rules to ViewModels with category info', () => {
    const { result } = renderHook(() => useRulesTable());

    expect(result.current.rules).toHaveLength(2);
    expect(result.current.rules[0]).toEqual(expect.objectContaining({
      id: 'r1',
      keyword: 'BIEDRONKA',
      matcherLabel: 'rules.form.matcherContains',
      categoryLabel: 'Spożywcze',
      categoryColor: '#4ade80',
    }));
  });

  it('maps Exact matcher type to correct label key', () => {
    const { result } = renderHook(() => useRulesTable());

    expect(result.current.rules[1].matcherLabel).toBe('rules.form.matcherExact');
  });

  it('uses fallback label for unknown category', () => {
    useRulesStore.setState({
      rules: [{ id: 'r3', keyword: 'X', matcherType: 'Contains', categoryId: 'unknown', priority: 1, createdAt: '' }],
    });

    const { result } = renderHook(() => useRulesTable());

    expect(result.current.rules[0].categoryLabel).toBe('rules.fallbackCategory');
  });

  it('handleDelete removes rule from store', () => {
    const { result } = renderHook(() => useRulesTable());

    act(() => {
      result.current.handleDelete('r1');
    });

    expect(useRulesStore.getState().rules).toHaveLength(1);
    expect(useRulesStore.getState().rules[0].id).toBe('r2');
  });

  it('returns empty array when no rules', () => {
    useRulesStore.setState({ rules: [] });

    const { result } = renderHook(() => useRulesTable());

    expect(result.current.rules).toEqual([]);
  });
});
