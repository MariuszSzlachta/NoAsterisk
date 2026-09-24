import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { useBudgetForm } from '#features/budgets/ui/hooks/useBudgetForm';
import { useBudgetFormInteractions } from '#features/budgets/ui/hooks/useBudgetFormInteractions';

describe('useBudgetFormInteractions', () => {
  it('maps submitted values and selected options to form operations', () => {
    const change = vi.fn();
    const submit = vi.fn();
    const type = vi.fn();
    const form: ReturnType<typeof useBudgetForm> = {
      values: {
        budgetType: 'standard',
        name: '',
        color: '#3b82f6',
        limitAmount: '',
        limitCurrency: 'PLN',
        periodType: 'monthly',
        dateFrom: '',
        dateTo: '',
      },
      errors: {},
      isSavings: false,
      isEditing: false,
      handleChange: change,
      handleBudgetTypeChange: type,
      handleSubmit: submit,
    };
    const { result } = renderHook(() => useBudgetFormInteractions(form));
    render(
      <form aria-label="budget" onSubmit={result.current.handleFormSubmit}>
        <input aria-label="name" onChange={result.current.handleNameChange} />
        <input
          aria-label="amount"
          onChange={result.current.handleLimitAmountChange}
        />
        <input
          aria-label="from"
          onChange={result.current.handleDateFromChange}
        />
        <input aria-label="to" onChange={result.current.handleDateToChange} />
      </form>,
    );
    fireEvent.change(screen.getByLabelText('name'), {
      target: { value: 'Travel' },
    });
    expect(change).toHaveBeenLastCalledWith('name', 'Travel');
    fireEvent.change(screen.getByLabelText('amount'), {
      target: { value: '250' },
    });
    expect(change).toHaveBeenLastCalledWith('limitAmount', '250');
    fireEvent.change(screen.getByLabelText('from'), {
      target: { value: '2026-09-01' },
    });
    expect(change).toHaveBeenLastCalledWith('dateFrom', '2026-09-01');
    fireEvent.change(screen.getByLabelText('to'), {
      target: { value: '2026-10-01' },
    });
    expect(change).toHaveBeenLastCalledWith('dateTo', '2026-10-01');
    result.current.createBudgetTypeHandler('savings')();
    expect(type).toHaveBeenCalledWith('savings');
    result.current.createColorHandler('#22c55e')();
    expect(change).toHaveBeenLastCalledWith('color', '#22c55e');
    result.current.createPeriodHandler('custom')();
    expect(change).toHaveBeenLastCalledWith('periodType', 'custom');
    fireEvent.submit(screen.getByRole('form'));
    expect(submit).toHaveBeenCalledOnce();
  });
});
