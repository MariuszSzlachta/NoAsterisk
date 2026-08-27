import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const CATEGORY_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kategoria', field: 'category', source: 'builtin' },
  { normalized: 'category', field: 'category', source: 'builtin' },
];
