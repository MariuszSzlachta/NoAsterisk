import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/header-heuristic';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const DEBIT_CREDIT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kwota wn', field: 'debit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'kwota winien', field: 'debit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'obciążenia', field: 'debit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'obciazenia', field: 'debit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'wydatki', field: 'debit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'debit', field: 'debit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'kwota ma', field: 'credit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'uznania', field: 'credit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'wpływy', field: 'credit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'wplywy', field: 'credit', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'credit', field: 'credit', source: HEURISTIC_SOURCE_BUILTIN },
];
