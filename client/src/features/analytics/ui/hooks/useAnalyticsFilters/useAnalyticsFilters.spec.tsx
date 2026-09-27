import { MemoryRouter } from 'react-router-dom';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAnalyticsFiltersStore } from '#features/analytics/store/useAnalyticsFiltersStore';

import { useAnalyticsFilters } from './useAnalyticsFilters';

const defaultFilters = {
  metrics: ['expenses'] as const,
  period: '6m' as const,
  chartType: 'line' as const,
  granularity: 'monthly' as const,
};

describe('useAnalyticsFilters', () => {
  beforeEach(() => {
    useAnalyticsFiltersStore.setState({
      filters: { ...defaultFilters, metrics: ['expenses'] },
    });
  });

  it('bootstraps metrics from the URL while retaining the other stored filters', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={['/?metric=income,savings']}>
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(() => useAnalyticsFilters(), { wrapper });

    await waitFor(() => {
      expect(result.current.filters.metrics).toEqual(['income', 'savings']);
    });
    expect(result.current.filters.period).toBe('6m');
    expect(result.current.setFilters).toBe(
      useAnalyticsFiltersStore.getState().setFilters,
    );
  });
});
