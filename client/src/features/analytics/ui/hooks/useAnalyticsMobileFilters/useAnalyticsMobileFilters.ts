import { useCallback, useState } from 'react';

import type { AnalyticsFilters } from '#features/analytics/model/types';

interface UseAnalyticsMobileFiltersResult {
  readonly isOpen: boolean;
  readonly draftFilters: AnalyticsFilters;
  readonly open: () => void;
  readonly cancel: () => void;
  readonly apply: () => void;
  readonly setDraftFilters: (filters: AnalyticsFilters) => void;
}

export const useAnalyticsMobileFilters = (
  filters: AnalyticsFilters,
  onApply: (filters: AnalyticsFilters) => void,
): UseAnalyticsMobileFiltersResult => {
  const [isOpen, setIsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<AnalyticsFilters>(filters);

  const open = useCallback((): void => {
    setDraftFilters({ ...filters, metrics: [...filters.metrics] });
    setIsOpen(true);
  }, [filters]);

  const cancel = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const apply = useCallback((): void => {
    onApply({ ...draftFilters, metrics: [...draftFilters.metrics] });
    setIsOpen(false);
  }, [draftFilters, onApply]);

  return { isOpen, draftFilters, open, cancel, apply, setDraftFilters };
};
