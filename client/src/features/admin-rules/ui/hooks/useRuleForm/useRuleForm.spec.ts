import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRuleForm } from './useRuleForm';

// ─── Mocks ───────────────────────────────────────────────────────

const mockAddRule = vi.fn();
const mockUpdateRule = vi.fn();

vi.mock('#features/admin-rules/store/useRulesStore', () => ({
  useRulesStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ addRule: mockAddRule, updateRule: mockUpdateRule }),
}));

// ─── Helpers ─────────────────────────────────────────────────────

const EXISTING_RULE = {
  id: 'rule-1',
  keyword: 'BIEDRONKA',
  matcherType: 'Contains' as const,
  categoryId: 'cat-groceries',
  priority: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
};

// ─── Tests ───────────────────────────────────────────────────────

describe('useRuleForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes with default values when no editing rule', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      expect(result.current.formValues).toEqual({
        keyword: '',
        matcherType: 'Contains',
        categoryId: '',
        priority: 1,
      });
      expect(result.current.isEditing).toBe(false);
    });

    it('initializes with rule values when editing', () => {
      const { result } = renderHook(() => useRuleForm(EXISTING_RULE, mockOnClose));

      expect(result.current.formValues).toEqual({
        keyword: 'BIEDRONKA',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 5,
      });
      expect(result.current.isEditing).toBe(true);
    });
  });

  describe('handleFieldChange', () => {
    it('updates field value', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleFieldChange('keyword', 'LIDL');
      });

      expect(result.current.formValues.keyword).toBe('LIDL');
    });

    it('clears error for updated field', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      // Trigger validation to get errors
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.keyword).toBeDefined();

      // Fix the field
      act(() => {
        result.current.handleFieldChange('keyword', 'VALID');
      });

      expect(result.current.errors.keyword).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('rejects empty keyword', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleFieldChange('categoryId', 'cat-1');
      });
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.keyword).toBeDefined();
      expect(mockAddRule).not.toHaveBeenCalled();
    });

    it('rejects empty categoryId', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleFieldChange('keyword', 'TEST');
      });
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.categoryId).toBeDefined();
      expect(mockAddRule).not.toHaveBeenCalled();
    });

    it('rejects priority less than 1', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleFieldChange('keyword', 'TEST');
        result.current.handleFieldChange('categoryId', 'cat-1');
        result.current.handleFieldChange('priority', 0);
      });
      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.priority).toBeDefined();
      expect(mockAddRule).not.toHaveBeenCalled();
    });
  });

  describe('handleSubmit', () => {
    it('calls addRule for new rule and closes', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleFieldChange('keyword', '  LIDL  ');
        result.current.handleFieldChange('categoryId', 'cat-groceries');
        result.current.handleFieldChange('priority', 3);
      });
      act(() => {
        result.current.handleSubmit();
      });

      expect(mockAddRule).toHaveBeenCalledWith({
        keyword: 'LIDL',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 3,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls updateRule for existing rule and closes', () => {
      const { result } = renderHook(() => useRuleForm(EXISTING_RULE, mockOnClose));

      act(() => {
        result.current.handleFieldChange('keyword', 'UPDATED');
      });
      act(() => {
        result.current.handleSubmit();
      });

      expect(mockUpdateRule).toHaveBeenCalledWith('rule-1', {
        keyword: 'UPDATED',
        matcherType: 'Contains',
        categoryId: 'cat-groceries',
        priority: 5,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('trims keyword whitespace', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleFieldChange('keyword', '  SPACES  ');
        result.current.handleFieldChange('categoryId', 'cat-1');
      });
      act(() => {
        result.current.handleSubmit();
      });

      expect(mockAddRule).toHaveBeenCalledWith(
        expect.objectContaining({ keyword: 'SPACES' }),
      );
    });
  });

  describe('handleCancel', () => {
    it('calls onClose', () => {
      const { result } = renderHook(() => useRuleForm(undefined, mockOnClose));

      act(() => {
        result.current.handleCancel();
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
