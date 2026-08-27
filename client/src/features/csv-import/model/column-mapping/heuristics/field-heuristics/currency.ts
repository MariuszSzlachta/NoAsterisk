import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const CURRENCY_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'waluta', field: 'currency', source: 'builtin' },
  { normalized: 'currency', field: 'currency', source: 'builtin' },
];
