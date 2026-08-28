import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const TITLE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'opis operacji', field: 'title', source: 'builtin' },
  { normalized: 'tytuł operacji', field: 'title', source: 'builtin' },
  { normalized: 'tytuł', field: 'title', source: 'builtin' },
  { normalized: 'opis', field: 'title', source: 'builtin' },
  { normalized: 'szczegóły', field: 'title', source: 'builtin' },
  { normalized: 'description', field: 'title', source: 'builtin' },
  { normalized: 'title', field: 'title', source: 'builtin' },
];
