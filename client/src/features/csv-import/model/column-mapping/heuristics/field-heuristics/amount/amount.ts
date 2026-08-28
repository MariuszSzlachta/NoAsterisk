import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const AMOUNT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kwota', field: 'amount', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'kwota operacji', field: 'amount', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'wartość', field: 'amount', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'amount', field: 'amount', source: HEURISTIC_SOURCE_BUILTIN },
];
