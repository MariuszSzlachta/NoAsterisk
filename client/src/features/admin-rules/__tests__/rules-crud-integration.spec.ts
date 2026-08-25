import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRuleFormStore } from '#features/admin-rules/store/useRuleFormStore';
import { useRulesStore } from '#features/admin-rules/store/useRulesStore';

// ─── Mock crypto for predictable IDs ─────────────────────────────

let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `rule-${++uuidCounter}`,
});

// ─── Helpers ─────────────────────────────────────────────────────

const getRule = (index: number): NonNullable<ReturnType<typeof useRulesStore.getState>['rules'][number]> => {
  const rule = useRulesStore.getState().rules[index];
  if (!rule) throw new Error(`No rule at index ${index}`);
  return rule;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('Admin-Rules CRUD — integration flow', () => {
  beforeEach(() => {
    uuidCounter = 0;
    useRulesStore.setState({ rules: [] });
    useRuleFormStore.setState({ showForm: false, editingRuleId: undefined });
  });

  it('full CRUD: add → appears in store → edit → verify update → delete', () => {
    // Step 1: Open add form
    act(() => { useRuleFormStore.getState().openAddForm(); });
    expect(useRuleFormStore.getState().showForm).toBe(true);
    expect(useRuleFormStore.getState().editingRuleId).toBeUndefined();

    // Step 2: Add a rule
    act(() => {
      useRulesStore.getState().addRule({
        keyword: 'BIEDRONKA',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 5,
      });
    });

    const rules = useRulesStore.getState().rules;
    expect(rules).toHaveLength(1);

    const firstRule = getRule(0);
    expect(firstRule.keyword).toBe('BIEDRONKA');
    expect(firstRule.id).toBe('rule-1');

    // Step 3: Close form
    act(() => { useRuleFormStore.getState().closeForm(); });
    expect(useRuleFormStore.getState().showForm).toBe(false);

    // Step 4: Open edit form for existing rule
    act(() => { useRuleFormStore.getState().openEditForm('rule-1'); });
    expect(useRuleFormStore.getState().showForm).toBe(true);
    expect(useRuleFormStore.getState().editingRuleId).toBe('rule-1');

    // Step 5: Update the rule
    act(() => {
      useRulesStore.getState().updateRule('rule-1', {
        keyword: 'LIDL',
        priority: 10,
      });
    });

    const updated = getRule(0);
    expect(updated.keyword).toBe('LIDL');
    expect(updated.priority).toBe(10);
    expect(updated.matcherType).toBe('Contains'); // unchanged
    expect(updated.categoryId).toBe('cat-groceries'); // unchanged

    // Step 6: Close form
    act(() => { useRuleFormStore.getState().closeForm(); });

    // Step 7: Delete the rule
    act(() => { useRulesStore.getState().deleteRule('rule-1'); });
    expect(useRulesStore.getState().rules).toHaveLength(0);
  });

  it('multiple rules maintain order and independence', () => {
    // Add 3 rules
    act(() => {
      useRulesStore.getState().addRule({ keyword: 'A', matcherType: 'Contains', categoryId: 'c1', priority: 1 });
      useRulesStore.getState().addRule({ keyword: 'B', matcherType: 'Exact', categoryId: 'c2', priority: 2 });
      useRulesStore.getState().addRule({ keyword: 'C', matcherType: 'Contains', categoryId: 'c3', priority: 3 });
    });

    expect(useRulesStore.getState().rules).toHaveLength(3);

    // Delete middle one
    act(() => { useRulesStore.getState().deleteRule('rule-2'); });

    const remaining = useRulesStore.getState().rules;
    expect(remaining).toHaveLength(2);

    const first = getRule(0);
    const second = getRule(1);
    expect(first.keyword).toBe('A');
    expect(second.keyword).toBe('C');

    // Update first one — doesn't affect last
    act(() => { useRulesStore.getState().updateRule('rule-1', { keyword: 'UPDATED' }); });

    const secondAfterUpdate = getRule(1);
    expect(secondAfterUpdate.keyword).toBe('C');
  });
});
