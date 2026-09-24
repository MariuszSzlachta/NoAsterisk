import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { useRulesTable } from '#features/admin-rules/ui/hooks/useRulesTable';
import { useRulesTablePresentation } from '#features/admin-rules/ui/hooks/useRulesTablePresentation';
import { i18n } from '#shared/i18n';

vi.mock('#features/admin-rules/ui/hooks/useRulesTable', () => ({
  useRulesTable: vi.fn(),
}));
describe('useRulesTablePresentation', () => {
  it('requires confirmation for the selected rule and clears cancelled deletion', () => {
    const rule: RuleViewModel = {
      id: 'rule-1',
      keyword: 'shop',
      matcherType: 'Contains',
      matcherLabel: 'Contains',
      categoryId: 'c',
      categoryLabel: 'Groceries',
      categoryColor: '#34d399',
      priority: 1,
      createdAt: '2026-09-13',
    };
    const remove = vi.fn();
    vi.mocked(useRulesTable).mockReturnValue({
      rules: [rule],
      handleDelete: remove,
    });
    const { result } = renderHook(() => useRulesTablePresentation(vi.fn()));
    act(() => result.current.confirmDelete());
    expect(remove).not.toHaveBeenCalled();
    act(() => result.current.requestDelete(rule.id));
    expect(result.current.pendingDelete).toEqual(rule);
    expect(remove).not.toHaveBeenCalled();
    act(() => result.current.cancelDelete());
    expect(result.current.pendingDelete).toBeUndefined();
    act(() => result.current.requestDelete(rule.id));
    act(() => result.current.confirmDelete());
    expect(remove).toHaveBeenCalledWith(rule.id);
    expect(result.current.pendingDelete).toBeUndefined();
    expect(result.current.getRowKey(rule)).toBe(rule.id);
    expect(result.current.columns.map((column) => column.header)).toContain(
      i18n.t('rules.columns.keyword'),
    );
  });
});
