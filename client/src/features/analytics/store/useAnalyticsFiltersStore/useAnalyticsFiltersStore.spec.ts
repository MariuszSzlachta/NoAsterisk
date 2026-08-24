import { beforeEach, describe, expect, it } from 'vitest';

import { useAnalyticsFiltersStore } from './useAnalyticsFiltersStore';

describe('useAnalyticsFiltersStore', () => {
  beforeEach(() => {
    // Reset to initial state
    useAnalyticsFiltersStore.setState({
      filters: {
        metrics: ['expenses'],
        period: '6m',
        chartType: 'line',
        granularity: 'monthly',
      },
    });
  });

  it('has correct initial state', () => {
    const { filters } = useAnalyticsFiltersStore.getState();
    expect(filters.metrics).toEqual(['expenses']);
    expect(filters.period).toBe('6m');
    expect(filters.chartType).toBe('line');
    expect(filters.granularity).toBe('monthly');
  });

  it('setFilters replaces entire filters object', () => {
    useAnalyticsFiltersStore.getState().setFilters({
      metrics: ['income', 'balance'],
      period: '1y',
      chartType: 'bar',
      granularity: 'weekly',
    });

    const { filters } = useAnalyticsFiltersStore.getState();
    expect(filters.metrics).toEqual(['income', 'balance']);
    expect(filters.period).toBe('1y');
    expect(filters.chartType).toBe('bar');
    expect(filters.granularity).toBe('weekly');
  });

  it('setFilters is idempotent with same value', () => {
    const original = useAnalyticsFiltersStore.getState().filters;
    useAnalyticsFiltersStore.getState().setFilters(original);
    expect(useAnalyticsFiltersStore.getState().filters).toEqual(original);
  });

  it('preserves other state on partial filter change', () => {
    useAnalyticsFiltersStore.getState().setFilters({
      ...useAnalyticsFiltersStore.getState().filters,
      period: '3m',
    });

    const { filters } = useAnalyticsFiltersStore.getState();
    expect(filters.period).toBe('3m');
    expect(filters.metrics).toEqual(['expenses']); // unchanged
  });
});
