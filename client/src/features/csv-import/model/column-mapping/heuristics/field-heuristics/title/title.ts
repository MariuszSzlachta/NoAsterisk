import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const TITLE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'opis operacji', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'tytuł operacji', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'tytuł', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'opis', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'szczegóły', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'description', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'title', field: 'title', source: HEURISTIC_SOURCE_BUILTIN },
];
