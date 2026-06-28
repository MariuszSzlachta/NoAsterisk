import { create } from 'zustand';

import type { AnalyticsFilters } from '#features/analytics/model/types';

interface AnalyticsFiltersState {
  readonly filters: AnalyticsFilters;
  readonly setFilters: (filters: AnalyticsFilters) => void;
}

export const useAnalyticsFiltersStore = create<AnalyticsFiltersState>(
  (set) => ({
    filters: {
      metrics: ['expenses'],
      period: '6m',
      chartType: 'line',
      granularity: 'monthly',
    },
    setFilters: (filters) => set({ filters }),
  }),
);
