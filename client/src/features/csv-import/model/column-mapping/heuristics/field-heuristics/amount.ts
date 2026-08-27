import type { HeaderHeuristic } from '../../types';

export const AMOUNT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kwota', field: 'amount', source: 'builtin' },
  { normalized: 'kwota operacji', field: 'amount', source: 'builtin' },
  { normalized: 'wartość', field: 'amount', source: 'builtin' },
  { normalized: 'amount', field: 'amount', source: 'builtin' },
];
