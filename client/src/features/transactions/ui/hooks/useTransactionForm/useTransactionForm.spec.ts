// ═══════════════════════════════════════════════════════════════════
// Transactions Feature — useTransactionForm Hook Tests
// ═══════════════════════════════════════════════════════════════════

import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTransactionsStore } from '#features/transactions/store/useTransactionsStore';
import { useToast } from '#shared/hooks/useToast';

import { useTransactionForm } from './useTransactionForm';

// ─── Mocks ───────────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useTransactionForm', () => {
  const mockOnClose = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
    useTransactionsStore.getState().clear();
  });

  it('initializes with today date', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));
    const today = new Date().toISOString().slice(0, 10);

    expect(result.current.formValues.date).toBe(today);
  });

  it('initializes with expense type', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    expect(result.current.formValues.type).toBe('expense');
  });

  it('initializes with empty title and amount', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    expect(result.current.formValues.title).toBe('');
    expect(result.current.formValues.amount).toBe('');
  });

  it('updates form value on handleChange', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    act(() => {
      result.current.handleChange('title', 'Biedronka');
    });

    expect(result.current.formValues.title).toBe('Biedronka');
  });

  it('clears field error on handleChange', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    // Trigger validation errors by submitting empty form
    act(() => {
      result.current.handleSubmit();
    });
    expect(result.current.errors.title).toBeDefined();

    // Change the field — error should clear
    act(() => {
      result.current.handleChange('title', 'Something');
    });
    expect(result.current.errors.title).toBeUndefined();
  });

  it('shows validation errors on submit with invalid data', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.errors.title).toBeDefined();
    expect(result.current.errors.amount).toBeDefined();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('calls store and onClose on valid submit', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    act(() => {
      result.current.handleChange('title', 'Biedronka');
      result.current.handleChange('amount', '50.00');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(useTransactionsStore.getState().transactions.length).toBe(1);
  });

  it('shows toast on successful submit', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    act(() => {
      result.current.handleChange('title', 'Kawa');
      result.current.handleChange('amount', '12');
    });

    act(() => {
      result.current.handleSubmit();
    });

    const toasts = useToast.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    expect(toasts[0].kind).toBe('success');
  });

  it('resets form after successful submit', () => {
    const { result } = renderHook(() => useTransactionForm(mockOnClose));

    act(() => {
      result.current.handleChange('title', 'Biedronka');
      result.current.handleChange('amount', '50');
    });

    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.formValues.title).toBe('');
    expect(result.current.formValues.amount).toBe('');
  });
});
