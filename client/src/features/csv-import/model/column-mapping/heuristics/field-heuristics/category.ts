import type { HeaderHeuristic } from '../../types';

export const CATEGORY_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kategoria', field: 'category', source: 'builtin' },
  { normalized: 'category', field: 'category', source: 'builtin' },
];
