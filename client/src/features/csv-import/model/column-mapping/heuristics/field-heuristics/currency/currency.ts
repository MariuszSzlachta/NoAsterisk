import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const CURRENCY_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'waluta', field: 'currency', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'currency', field: 'currency', source: HEURISTIC_SOURCE_BUILTIN },
];
