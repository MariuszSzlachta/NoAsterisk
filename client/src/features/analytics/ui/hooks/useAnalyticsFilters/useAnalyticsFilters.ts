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
