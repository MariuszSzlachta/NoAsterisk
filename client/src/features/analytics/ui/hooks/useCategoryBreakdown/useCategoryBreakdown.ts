import { useEffect, useRef, useState } from 'react';

import { useCategoryBreakdownQuery } from '#features/analytics/api/useCategoryBreakdownQuery';
import type {
  CategoryBreakdownFilters,
  CategoryBreakdownItem,
} from '#features/analytics/model/types';
import type { QueryState } from '#shared/api';

interface UseCategoryBreakdownResult {
  readonly state: QueryState<CategoryBreakdownItem[]>;
  readonly selectedCategory: string | undefined;
  readonly createCategoryClickHandler: (category: string) => () => void;
  readonly handleDrilldownClose: () => void;
}

export const useCategoryBreakdown = (
  filters: CategoryBreakdownFilters,
): UseCategoryBreakdownResult => {
  const state = useCategoryBreakdownQuery(filters);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined,
  );

  // Reset selection when filters change — previous selection may not exist in new results.
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (prev.metric !== filters.metric || prev.period !== filters.period || prev.granularity !== filters.granularity) {
      setSelectedCategory(undefined);
    }
    prevFiltersRef.current = filters;
  }, [filters]);

  const createCategoryClickHandler = (category: string) => (): void => {
    setSelectedCategory(selectedCategory === category ? undefined : category);
  };

  const handleDrilldownClose = (): void => {
    setSelectedCategory(undefined);
  };

  return {
    state,
    selectedCategory,
    createCategoryClickHandler,
    handleDrilldownClose,
  };
};
