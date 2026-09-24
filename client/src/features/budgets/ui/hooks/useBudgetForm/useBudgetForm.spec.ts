import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBudgetsStore } from '#features/budgets/store/useBudgetsStore';
import { useBudgetForm } from './useBudgetForm';

describe('useBudgetForm', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    useBudgetsStore.setState({ budgets: [] });
    mockOnClose.mockReset();
  });

  describe('initial state', () => {
    it('returns default values for new budget', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      expect(result.current.values.budgetType).toBe('standard');
      expect(result.current.values.name).toBe('');
      expect(result.current.values.limitAmount).toBe('');
      expect(result.current.values.periodType).toBe('monthly');
      expect(result.current.isEditing).toBe(false);
      expect(result.current.isSavings).toBe(false);
    });

    it('uses initialBudgetType when provided', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1', initialBudgetType: 'savings' }),
      );

      expect(result.current.values.budgetType).toBe('savings');
      expect(result.current.isSavings).toBe(true);
    });

    it('populates values from editBudget', () => {
      const editBudget = {
        id: 'b-1',
        workspaceId: 'ws-1',
        budgetType: 'standard',
        name: 'Groceries',
        color: '#34d399',
        limitAmount: 2000,
        limitCurrency: 'PLN',
        period: { type: 'custom', dateFrom: '2026-07-01', dateTo: '2026-07-31' },
        categoryIds: [],
        createdAt: '2026-06-01T00:00:00.000Z',
        isArchived: false,
      };

      const { result } = renderHook(() =>
        useBudgetForm({ editBudget, onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      expect(result.current.values.name).toBe('Groceries');
      expect(result.current.values.limitAmount).toBe('2000');
      expect(result.current.values.periodType).toBe('custom');
      expect(result.current.values.dateFrom).toBe('2026-07-01');
      expect(result.current.values.dateTo).toBe('2026-07-31');
      expect(result.current.isEditing).toBe(true);
    });
  });

  describe('handleChange', () => {
    it('updates field value', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('name', 'My Budget');
      });

      expect(result.current.values.name).toBe('My Budget');
    });

    it('clears field error when value changes', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      // Trigger validation to set errors
      act(() => {
        result.current.handleSubmit();
      });
      expect(result.current.errors.name).toBeDefined();

      // Type in name to clear error
      act(() => {
        result.current.handleChange('name', 'X');
      });
      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('handleBudgetTypeChange', () => {
    it('switches to savings', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleBudgetTypeChange('savings');
      });

      expect(result.current.values.budgetType).toBe('savings');
      expect(result.current.isSavings).toBe(true);
    });

    it('clears all errors on type change', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleSubmit();
      });
      expect(result.current.errors.name).toBeDefined();

      act(() => {
        result.current.handleBudgetTypeChange('savings');
      });
      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('validation', () => {
    it('requires name', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('limitAmount', '1000');
        result.current.handleSubmit();
      });

      expect(result.current.errors.name).toBeDefined();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('requires positive limitAmount for standard budget', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('name', 'Test');
        result.current.handleChange('limitAmount', '0');
        result.current.handleSubmit();
      });

      expect(result.current.errors.limitAmount).toBeDefined();
    });

    it('requires custom dates when periodType is custom', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('name', 'Test');
        result.current.handleChange('limitAmount', '1000');
        result.current.handleChange('periodType', 'custom');
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.dateFrom).toBeDefined();
      expect(result.current.errors.dateTo).toBeDefined();
    });

    it('validates dateFrom < dateTo for custom period', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('name', 'Test');
        result.current.handleChange('limitAmount', '1000');
        result.current.handleChange('periodType', 'custom');
        result.current.handleChange('dateFrom', '2026-08-31');
        result.current.handleChange('dateTo', '2026-08-01');
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.dateTo).toBeDefined();
    });

    it('allows empty limitAmount for savings (optional goal)', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1', initialBudgetType: 'savings' }),
      );

      act(() => {
        result.current.handleChange('name', 'My Savings');
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(result.current.errors.limitAmount).toBeUndefined();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('handleSubmit — create', () => {
    it('creates standard budget and calls onClose', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('name', 'Groceries');
        result.current.handleChange('limitAmount', '2000');
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(mockOnClose).toHaveBeenCalledOnce();
      const budgets = useBudgetsStore.getState().budgets;
      expect(budgets).toHaveLength(1);
      expect(budgets[0]?.name).toBe('Groceries');
      expect(budgets[0]?.limitAmount).toBe(2000);
      expect(budgets[0]?.budgetType).toBe('standard');
      expect(budgets[0]?.period).toEqual({ type: 'monthly' });
    });

    it('creates savings budget with null period', () => {
      const { result } = renderHook(() =>
        useBudgetForm({ onClose: mockOnClose, workspaceId: 'ws-1', initialBudgetType: 'savings' }),
      );

      act(() => {
        result.current.handleChange('name', 'Savings');
        result.current.handleChange('limitAmount', '5000');
      });

      act(() => {
        result.current.handleSubmit();
      });

      const budgets = useBudgetsStore.getState().budgets;
      expect(budgets[0]?.budgetType).toBe('savings');
      expect(budgets[0]?.period).toBeNull();
    });
  });

  describe('handleSubmit — update', () => {
    it('updates existing budget', () => {
      // Seed a budget
      useBudgetsStore.getState().createBudget({
        workspaceId: 'ws-1',
        name: 'Old Name',
        budgetType: 'standard',
        color: '#000',
        limitAmount: 1000,
        limitCurrency: 'PLN',
        period: { type: 'monthly' },
      });
      const editBudget = useBudgetsStore.getState().budgets[0];

      const { result } = renderHook(() =>
        useBudgetForm({ editBudget, onClose: mockOnClose, workspaceId: 'ws-1' }),
      );

      act(() => {
        result.current.handleChange('name', 'New Name');
        result.current.handleChange('limitAmount', '3000');
      });

      act(() => {
        result.current.handleSubmit();
      });

      expect(mockOnClose).toHaveBeenCalledOnce();
      const updated = useBudgetsStore.getState().budgets[0];
      expect(updated?.name).toBe('New Name');
      expect(updated?.limitAmount).toBe(3000);
    });
  });
});
