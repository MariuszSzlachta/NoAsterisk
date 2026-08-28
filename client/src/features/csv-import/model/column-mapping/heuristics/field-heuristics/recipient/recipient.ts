import type { HeaderHeuristic } from '#features/csv-import/model/column-mapping/types';
import { HEURISTIC_SOURCE_BUILTIN } from '#features/csv-import/model/column-mapping/heuristics/heuristic-source-builtin';

export const RECIPIENT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'adresat', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'odbiorca', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'nazwa odbiorcy', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'beneficjent', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'dane kontrahenta', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'kontrahent', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'counterparty', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'beneficiary', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'recipient', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'to', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
  { normalized: 'payee', field: 'recipient', source: HEURISTIC_SOURCE_BUILTIN },
];
