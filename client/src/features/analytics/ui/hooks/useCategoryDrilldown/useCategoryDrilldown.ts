import { useCategoryDrilldownQuery } from '#features/analytics/api/useCategoryDrilldownQuery';
import type {
  CategoryBreakdownFilters,
  CategoryDrilldownData,
} from '#features/analytics/model/types';
import type { QueryState } from '#shared/api';

export const useCategoryDrilldown = (
  category: string,
  filters: CategoryBreakdownFilters,
): QueryState<CategoryDrilldownData> =>
  useCategoryDrilldownQuery(category, filters);
