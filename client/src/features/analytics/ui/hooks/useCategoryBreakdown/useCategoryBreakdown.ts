import { useState } from 'react';

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
