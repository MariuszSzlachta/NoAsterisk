import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AnalyticsFilters } from '#features/analytics/model/types';

import { useAnalyticsMobileFilters } from './useAnalyticsMobileFilters';

const baseFilters: AnalyticsFilters = {
  metrics: ['expenses', 'income'],
  period: '6m',
  chartType: 'line',
  granularity: 'monthly',
};

describe('useAnalyticsMobileFilters', () => {
  it('starts closed with the applied filters as the draft', () => {
    const onApply = vi.fn();
    const { result } = renderHook(() => useAnalyticsMobileFilters(baseFilters, onApply));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.draftFilters).toEqual(baseFilters);
  });

  it('copies current applied filters when opened', () => {
    const onApply = vi.fn();
    const { result } = renderHook(() => useAnalyticsMobileFilters(baseFilters, onApply));
    const nextFilters: AnalyticsFilters = { ...baseFilters, period: '1y' };

    act(() => result.current.open());
    act(() => result.current.setDraftFilters(nextFilters));
    act(() => result.current.cancel());
    act(() => result.current.open());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.draftFilters).toEqual(baseFilters);
  });

  it('discards draft changes when cancelled', () => {
    const onApply = vi.fn();
    const { result } = renderHook(() => useAnalyticsMobileFilters(baseFilters, onApply));
    const nextFilters: AnalyticsFilters = { ...baseFilters, period: '1y' };

    act(() => result.current.open());
    act(() => result.current.setDraftFilters(nextFilters));
    act(() => result.current.cancel());

    expect(result.current.isOpen).toBe(false);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('applies the draft once and closes the panel', () => {
    const onApply = vi.fn();
    const { result } = renderHook(() => useAnalyticsMobileFilters(baseFilters, onApply));
    const nextFilters: AnalyticsFilters = { ...baseFilters, chartType: 'bar' };

    act(() => result.current.open());
    act(() => result.current.setDraftFilters(nextFilters));
    act(() => result.current.apply());

    expect(result.current.isOpen).toBe(false);
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith(nextFilters);
  });
});
