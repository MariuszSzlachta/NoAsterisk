import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const BALANCE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'saldo po operacji', field: 'balance', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'saldo końcowe', field: 'balance', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'saldo', field: 'balance', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'balance', field: 'balance', source: HEURISTIC_SOURCE_BUILTIN },
];
