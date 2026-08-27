import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const REFERENCE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'referencja', field: 'reference', source: 'builtin' },
  { normalized: 'nr referencyjny', field: 'reference', source: 'builtin' },
  { normalized: 'nr ref', field: 'reference', source: 'builtin' },
  { normalized: 'numer operacji', field: 'reference', source: 'builtin' },
  { normalized: 'identyfikator operacji', field: 'reference', source: 'builtin' },
  { normalized: 'reference', field: 'reference', source: 'builtin' },
  { normalized: 'ref number', field: 'reference', source: 'builtin' },
  { normalized: 'transaction id', field: 'reference', source: 'builtin' },
];
