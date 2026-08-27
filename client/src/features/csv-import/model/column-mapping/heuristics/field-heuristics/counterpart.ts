import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';

export const COUNTERPART_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'nadawca/odbiorca', field: 'counterpart', source: 'builtin' },
  { normalized: 'nadawca / odbiorca', field: 'counterpart', source: 'builtin' },
  { normalized: 'nazwa nadawcy / odbiorcy', field: 'counterpart', source: 'builtin' },
  { normalized: 'strona transakcji', field: 'counterpart', source: 'builtin' },
];
