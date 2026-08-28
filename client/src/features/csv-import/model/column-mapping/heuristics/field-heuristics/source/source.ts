import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const SOURCE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'nadawca', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'nazwa nadawcy', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'zleceniodawca', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'źródło', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'sender', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'from', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'remitter', field: 'source', source: HEURISTIC_SOURCE_BUILTIN },
];
