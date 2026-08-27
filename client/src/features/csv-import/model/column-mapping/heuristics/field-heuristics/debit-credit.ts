import type { HeaderHeuristic } from '../../types';

export const DEBIT_CREDIT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'kwota wn', field: 'debit', source: 'builtin' },
  { normalized: 'kwota winien', field: 'debit', source: 'builtin' },
  { normalized: 'obciążenia', field: 'debit', source: 'builtin' },
  { normalized: 'obciazenia', field: 'debit', source: 'builtin' },
  { normalized: 'wydatki', field: 'debit', source: 'builtin' },
  { normalized: 'debit', field: 'debit', source: 'builtin' },
  { normalized: 'kwota ma', field: 'credit', source: 'builtin' },
  { normalized: 'uznania', field: 'credit', source: 'builtin' },
  { normalized: 'wpływy', field: 'credit', source: 'builtin' },
  { normalized: 'wplywy', field: 'credit', source: 'builtin' },
  { normalized: 'credit', field: 'credit', source: 'builtin' },
];
