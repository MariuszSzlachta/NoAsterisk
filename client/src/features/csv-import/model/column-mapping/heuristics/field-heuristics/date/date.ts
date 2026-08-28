import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const DATE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'data operacji', field: 'date', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'data transakcji', field: 'date', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'data księgowania', field: 'date', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'data waluty', field: 'date', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'data', field: 'date', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'date', field: 'date', source: HEURISTIC_SOURCE_BUILTIN },
];
