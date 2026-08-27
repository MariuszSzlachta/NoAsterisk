import type { HeaderHeuristic } from '../../types';

export const CURRENCY_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'waluta', field: 'currency', source: 'builtin' },
  { normalized: 'currency', field: 'currency', source: 'builtin' },
];
