import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { parseMetricsParam } from '#features/analytics/model/parseMetricsParam';
import type { AnalyticsFilters } from '#features/analytics/model/types';
import { useAnalyticsFiltersStore } from '#features/analytics/store/useAnalyticsFiltersStore';

export const useAnalyticsFilters = (): {
  readonly filters: AnalyticsFilters;
  readonly setFilters: (filters: AnalyticsFilters) => void;
} => {
  const [searchParams] = useSearchParams();
  const { filters, setFilters } = useAnalyticsFiltersStore();
  const initialized = useRef(false);

  // Intentional one-way bootstrap: URL params seed the store on first mount only.
  // The Zustand store is the single source of truth after initialization.
  // URL is NOT kept in sync — this avoids bidirectional sync complexity.
  // Deep-link support works via initial page load; in-app navigation uses store directly.
  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;
    const current = useAnalyticsFiltersStore.getState().filters;
    const metrics = parseMetricsParam(searchParams.get('metric'));
    useAnalyticsFiltersStore.getState().setFilters({ ...current, metrics });
  }, [searchParams]);

  return { filters, setFilters };
};
