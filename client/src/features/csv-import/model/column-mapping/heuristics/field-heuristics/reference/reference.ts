import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const REFERENCE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'referencja', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'nr referencyjny', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'nr ref', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'numer operacji', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'identyfikator operacji', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'reference', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'ref number', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'transaction id', field: 'reference', source: HEURISTIC_SOURCE_BUILTIN },
];
