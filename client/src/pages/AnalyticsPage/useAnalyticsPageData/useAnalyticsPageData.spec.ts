import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAnalyticsPageData } from './useAnalyticsPageData';

// ─── Mocks ───────────────────────────────────────────────────────

const mockSetFilters = vi.fn();
const mockFilters = {
  metrics: ['expenses', 'income'],
  period: '30d',
  chartType: 'line',
  granularity: 'daily',
};

vi.mock('#features/analytics', () => ({
  useAnalyticsFilters: () => ({
    filters: mockFilters,
    setFilters: mockSetFilters,
  }),
  useAnalyticsQuery: () => ({ status: 'loading' }),
}));

// ─── Tests ───────────────────────────────────────────────────────

describe('useAnalyticsPageData', () => {
  it('returns filters from useAnalyticsFilters', () => {
    const { result } = renderHook(() => useAnalyticsPageData());

    expect(result.current.filters.metrics).toEqual(['expenses', 'income']);
    expect(result.current.filters.period).toBe('30d');
    expect(result.current.filters.chartType).toBe('line');
    expect(result.current.filters.granularity).toBe('daily');
  });

  it('returns setFilters function', () => {
    const { result } = renderHook(() => useAnalyticsPageData());

    expect(result.current.setFilters).toBe(mockSetFilters);
  });

  it('returns query state from useAnalyticsQuery', () => {
    const { result } = renderHook(() => useAnalyticsPageData());

    expect(result.current.state).toEqual({ status: 'loading' });
  });

  it('computes breakdownFilters when expenses metric is present', () => {
    const { result } = renderHook(() => useAnalyticsPageData());

    expect(result.current.breakdownFilters).toEqual({
      metric: 'expenses',
      period: '30d',
      granularity: 'daily',
    });
  });

  it('picks first matching breakdown metric (expenses over income)', () => {
    const { result } = renderHook(() => useAnalyticsPageData());

    // expenses comes first in the array → it's selected
    expect(result.current.breakdownFilters?.metric).toBe('expenses');
  });

  it('returns undefined breakdownFilters when no expenses/income metric', () => {
    // Temporarily override metrics to have no breakdown candidates
    const originalMetrics = mockFilters.metrics;
    mockFilters.metrics = ['balance', 'savings'];

    const { result } = renderHook(() => useAnalyticsPageData());

    expect(result.current.breakdownFilters).toBeUndefined();

    // Restore
    mockFilters.metrics = originalMetrics;
  });
});
