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

  // REVIEW [P1]: Selection nie jest uzgadniany po zmianie period/metric. Po zmianie
  // filtrów może zostać otwarty drilldown dla kategorii, której już nie ma w wyniku,
  // albo dla starego labelu. Trzymaj categoryId i resetuj/reconcile selection
  // względem aktualnych items po zmianie query.
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
