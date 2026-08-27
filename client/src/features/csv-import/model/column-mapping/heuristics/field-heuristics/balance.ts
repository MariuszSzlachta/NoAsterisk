import type { HeaderHeuristic } from '../../types';

export const BALANCE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'saldo po operacji', field: 'balance', source: 'builtin' },
  { normalized: 'saldo końcowe', field: 'balance', source: 'builtin' },
  { normalized: 'saldo', field: 'balance', source: 'builtin' },
  { normalized: 'balance', field: 'balance', source: 'builtin' },
];
