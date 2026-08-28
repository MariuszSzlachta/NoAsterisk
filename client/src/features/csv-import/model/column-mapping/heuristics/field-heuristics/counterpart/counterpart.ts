import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const COUNTERPART_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'nadawca/odbiorca', field: 'counterpart', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'nadawca / odbiorca', field: 'counterpart', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'nazwa nadawcy / odbiorcy', field: 'counterpart', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'strona transakcji', field: 'counterpart', source: HEURISTIC_SOURCE_BUILTIN },
];
