import type { HeaderHeuristic } from '../../types';

export const DATE_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'data operacji', field: 'date', source: 'builtin' },
  { normalized: 'data transakcji', field: 'date', source: 'builtin' },
  { normalized: 'data księgowania', field: 'date', source: 'builtin' },
  { normalized: 'data waluty', field: 'date', source: 'builtin' },
  { normalized: 'data', field: 'date', source: 'builtin' },
  { normalized: 'date', field: 'date', source: 'builtin' },
];
