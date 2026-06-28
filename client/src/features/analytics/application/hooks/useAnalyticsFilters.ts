import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAnalyticsFiltersStore } from '#features/analytics/infrastructure/store/useAnalyticsFiltersStore';
import type { AnalyticsFilters } from '#features/analytics/model/types';
import { parseMetricsParam } from '#features/analytics/model/parseMetricsParam';

interface AnalyticsFiltersPort {
  readonly filters: AnalyticsFilters;
  readonly setFilters: (filters: AnalyticsFilters) => void;
}

export const useAnalyticsFilters = (): AnalyticsFiltersPort => {
  const [searchParams] = useSearchParams();
  const { filters, setFilters } = useAnalyticsFiltersStore();
  const initialized = useRef(false);

  if (!initialized.current) {
    initialized.current = true;
    const metrics = parseMetricsParam(searchParams.get('metric'));
    setFilters({ ...filters, metrics });
  }

  return { filters, setFilters };
};
