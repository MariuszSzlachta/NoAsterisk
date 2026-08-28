import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const CATEGORY_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kategoria', field: 'category', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'category', field: 'category', source: HEURISTIC_SOURCE_BUILTIN },
];
