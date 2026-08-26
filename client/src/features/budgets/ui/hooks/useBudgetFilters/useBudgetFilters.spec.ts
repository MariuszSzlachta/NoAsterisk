import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useBudgetFilters } from './useBudgetFilters';

describe('useBudgetFilters', () => {
  it('initializes with monthly period', () => {
    const { result } = renderHook(() => useBudgetFilters());

    expect(result.current.selectedPeriod).toBe('monthly');
  });

  it('changes period to yearly', () => {
    const { result } = renderHook(() => useBudgetFilters());

    act(() => {
      result.current.handlePeriodChange('yearly');
    });

    expect(result.current.selectedPeriod).toBe('yearly');
  });

  it('changes period to custom', () => {
    const { result } = renderHook(() => useBudgetFilters());

    act(() => {
      result.current.handlePeriodChange('custom');
    });

    expect(result.current.selectedPeriod).toBe('custom');
  });

  it('changes period to savings', () => {
    const { result } = renderHook(() => useBudgetFilters());

    act(() => {
      result.current.handlePeriodChange('savings');
    });

    expect(result.current.selectedPeriod).toBe('savings');
  });

  it('ignores invalid period values', () => {
    const { result } = renderHook(() => useBudgetFilters());

    act(() => {
      result.current.handlePeriodChange('invalid-value');
    });

    expect(result.current.selectedPeriod).toBe('monthly');
  });
});
