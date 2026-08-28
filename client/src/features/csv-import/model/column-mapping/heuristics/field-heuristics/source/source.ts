import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const SOURCE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'nadawca', field: 'source', source: 'builtin' },
  { normalized: 'nazwa nadawcy', field: 'source', source: 'builtin' },
  { normalized: 'zleceniodawca', field: 'source', source: 'builtin' },
  { normalized: 'źródło', field: 'source', source: 'builtin' },
  { normalized: 'sender', field: 'source', source: 'builtin' },
  { normalized: 'from', field: 'source', source: 'builtin' },
  { normalized: 'remitter', field: 'source', source: 'builtin' },
];
