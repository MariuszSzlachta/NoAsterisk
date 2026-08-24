import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRulesStore } from './useRulesStore';

// ─── Setup ───────────────────────────────────────────────────────

beforeEach(() => {
  const { setState } = useRulesStore;
  setState({ rules: [] });
});

// Mock crypto.randomUUID for predictable IDs
vi.stubGlobal('crypto', {
  randomUUID: () => 'mock-uuid-123',
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useRulesStore', () => {
  describe('addRule', () => {
    it('adds a rule with generated id and timestamp', () => {
      const dateSpy = vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-08-24T12:00:00.000Z');

      act(() => {
        useRulesStore.getState().addRule({
          keyword: 'BIEDRONKA',
          matcherType: 'Contains',
          categoryId: 'cat-groceries',
          priority: 1,
        });
      });

      const rules = useRulesStore.getState().rules;
      expect(rules).toHaveLength(1);
      expect(rules[0]).toEqual({
        id: 'mock-uuid-123',
        keyword: 'BIEDRONKA',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 1,
        createdAt: '2026-08-24T12:00:00.000Z',
      });

      dateSpy.mockRestore();
    });

    it('appends to existing rules', () => {
      act(() => {
        useRulesStore.getState().addRule({
          keyword: 'FIRST',
          matcherType: 'Contains',
          categoryId: 'cat-1',
          priority: 1,
        });
      });
      act(() => {
        useRulesStore.getState().addRule({
          keyword: 'SECOND',
          matcherType: 'Exact',
          categoryId: 'cat-2',
          priority: 2,
        });
      });

      expect(useRulesStore.getState().rules).toHaveLength(2);
    });
  });

  describe('updateRule', () => {
    it('updates specified fields of a rule', () => {
      act(() => {
        useRulesStore.getState().addRule({
          keyword: 'ORIGINAL',
          matcherType: 'Contains',
          categoryId: 'cat-1',
          priority: 1,
        });
      });

      const ruleId = useRulesStore.getState().rules[0].id;

      act(() => {
        useRulesStore.getState().updateRule(ruleId, {
          keyword: 'UPDATED',
          priority: 5,
        });
      });

      const updated = useRulesStore.getState().rules[0];
      expect(updated.keyword).toBe('UPDATED');
      expect(updated.priority).toBe(5);
      expect(updated.matcherType).toBe('Contains'); // unchanged
      expect(updated.categoryId).toBe('cat-1'); // unchanged
    });

    it('does not modify other rules', () => {
      act(() => {
        useRulesStore.setState({
          rules: [
            { id: 'r1', keyword: 'A', matcherType: 'Contains', categoryId: 'c1', priority: 1, createdAt: '' },
            { id: 'r2', keyword: 'B', matcherType: 'Exact', categoryId: 'c2', priority: 2, createdAt: '' },
          ],
        });
      });

      act(() => {
        useRulesStore.getState().updateRule('r1', { keyword: 'UPDATED' });
      });

      expect(useRulesStore.getState().rules[1].keyword).toBe('B');
    });
  });

  describe('deleteRule', () => {
    it('removes rule by id', () => {
      act(() => {
        useRulesStore.setState({
          rules: [
            { id: 'r1', keyword: 'A', matcherType: 'Contains', categoryId: 'c1', priority: 1, createdAt: '' },
            { id: 'r2', keyword: 'B', matcherType: 'Exact', categoryId: 'c2', priority: 2, createdAt: '' },
          ],
        });
      });

      act(() => {
        useRulesStore.getState().deleteRule('r1');
      });

      const rules = useRulesStore.getState().rules;
      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('r2');
    });

    it('does nothing for non-existent id', () => {
      act(() => {
        useRulesStore.setState({
          rules: [
            { id: 'r1', keyword: 'A', matcherType: 'Contains', categoryId: 'c1', priority: 1, createdAt: '' },
          ],
        });
      });

      act(() => {
        useRulesStore.getState().deleteRule('non-existent');
      });

      expect(useRulesStore.getState().rules).toHaveLength(1);
    });
  });
});
