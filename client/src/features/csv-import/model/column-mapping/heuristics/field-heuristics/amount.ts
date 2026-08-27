import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const AMOUNT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kwota', field: 'amount', source: 'builtin' },
  { normalized: 'kwota operacji', field: 'amount', source: 'builtin' },
  { normalized: 'wartość', field: 'amount', source: 'builtin' },
  { normalized: 'amount', field: 'amount', source: 'builtin' },
];
