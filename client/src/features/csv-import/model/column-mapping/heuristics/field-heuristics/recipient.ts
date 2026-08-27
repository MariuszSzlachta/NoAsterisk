import type { HeaderHeuristic } from '../../types';

export const RECIPIENT_HEURISTICS: readonly HeaderHeuristic[] = [
  { normalized: 'adresat', field: 'recipient', source: 'builtin' },
  { normalized: 'odbiorca', field: 'recipient', source: 'builtin' },
  { normalized: 'nazwa odbiorcy', field: 'recipient', source: 'builtin' },
  { normalized: 'beneficjent', field: 'recipient', source: 'builtin' },
  { normalized: 'dane kontrahenta', field: 'recipient', source: 'builtin' },
  { normalized: 'kontrahent', field: 'recipient', source: 'builtin' },
  { normalized: 'counterparty', field: 'recipient', source: 'builtin' },
  { normalized: 'beneficiary', field: 'recipient', source: 'builtin' },
  { normalized: 'recipient', field: 'recipient', source: 'builtin' },
  { normalized: 'to', field: 'recipient', source: 'builtin' },
  { normalized: 'payee', field: 'recipient', source: 'builtin' },
];
