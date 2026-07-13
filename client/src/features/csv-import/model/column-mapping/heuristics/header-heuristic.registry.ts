import type { DomainField } from '../types';

// ═══════════════════════════════════════════════════════════════════
// Header Heuristic Registry — Extensible keyword → field mapping
// ═══════════════════════════════════════════════════════════════════

export interface HeaderHeuristic {
  readonly normalized: string;
  readonly field: DomainField;
  readonly source: 'builtin' | 'user';
}

/**
 * Built-in header heuristics for Polish (PL) and English (EN) bank CSV formats.
 * These cover mBank, PKO BP, ING, Santander, Millennium, Revolut, and generic CSVs.
 */
const BUILTIN_HEURISTICS: readonly HeaderHeuristic[] = [
  // Date columns
  { normalized: 'data operacji', field: 'date', source: 'builtin' },
  { normalized: 'data transakcji', field: 'date', source: 'builtin' },
  { normalized: 'data księgowania', field: 'date', source: 'builtin' },
  { normalized: 'data waluty', field: 'date', source: 'builtin' },
  { normalized: 'data', field: 'date', source: 'builtin' },
  { normalized: 'date', field: 'date', source: 'builtin' },

  // Title/description columns
  { normalized: 'opis operacji', field: 'title', source: 'builtin' },
  { normalized: 'tytuł operacji', field: 'title', source: 'builtin' },
  { normalized: 'tytuł', field: 'title', source: 'builtin' },
  { normalized: 'opis', field: 'title', source: 'builtin' },
  { normalized: 'szczegóły', field: 'title', source: 'builtin' },
  { normalized: 'description', field: 'title', source: 'builtin' },
  { normalized: 'title', field: 'title', source: 'builtin' },

  // Amount columns
  { normalized: 'kwota', field: 'amount', source: 'builtin' },
  { normalized: 'kwota operacji', field: 'amount', source: 'builtin' },
  { normalized: 'wartość', field: 'amount', source: 'builtin' },
  { normalized: 'amount', field: 'amount', source: 'builtin' },

  // Currency
  { normalized: 'waluta', field: 'currency', source: 'builtin' },
  { normalized: 'currency', field: 'currency', source: 'builtin' },

  // Balance
  { normalized: 'saldo po operacji', field: 'balance', source: 'builtin' },
  { normalized: 'saldo końcowe', field: 'balance', source: 'builtin' },
  { normalized: 'saldo', field: 'balance', source: 'builtin' },
  { normalized: 'balance', field: 'balance', source: 'builtin' },

  // Debit/credit split columns
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

  // Category
  { normalized: 'kategoria', field: 'category', source: 'builtin' },
  { normalized: 'category', field: 'category', source: 'builtin' },

  // Source (sender/originator)
  { normalized: 'nadawca', field: 'source', source: 'builtin' },
  { normalized: 'nazwa nadawcy', field: 'source', source: 'builtin' },
  { normalized: 'zleceniodawca', field: 'source', source: 'builtin' },
  { normalized: 'źródło', field: 'source', source: 'builtin' },
  { normalized: 'sender', field: 'source', source: 'builtin' },
  { normalized: 'from', field: 'source', source: 'builtin' },
  { normalized: 'remitter', field: 'source', source: 'builtin' },

  // Recipient (beneficiary/payee)
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

  // Counterpart (combined sender/recipient — when bank doesn't separate)
  { normalized: 'nadawca/odbiorca', field: 'counterpart', source: 'builtin' },
  { normalized: 'nadawca / odbiorca', field: 'counterpart', source: 'builtin' },
  { normalized: 'nazwa nadawcy / odbiorcy', field: 'counterpart', source: 'builtin' },
  { normalized: 'strona transakcji', field: 'counterpart', source: 'builtin' },

  // Reference (transaction identifier)
  { normalized: 'referencja', field: 'reference', source: 'builtin' },
  { normalized: 'nr referencyjny', field: 'reference', source: 'builtin' },
  { normalized: 'nr ref', field: 'reference', source: 'builtin' },
  { normalized: 'numer operacji', field: 'reference', source: 'builtin' },
  { normalized: 'identyfikator operacji', field: 'reference', source: 'builtin' },
  { normalized: 'reference', field: 'reference', source: 'builtin' },
  { normalized: 'ref number', field: 'reference', source: 'builtin' },
  { normalized: 'transaction id', field: 'reference', source: 'builtin' },
];

/**
 * Registry pattern — extensible collection of header heuristics.
 *
 * User can register additional heuristics (persisted in IndexedDB).
 * Lookup is first-match: user heuristics registered after builtins
 * can override by being found first if registered at the beginning.
 */
export class HeaderHeuristicRegistry {
  private readonly entries: HeaderHeuristic[];

  constructor(builtins: readonly HeaderHeuristic[] = BUILTIN_HEURISTICS) {
    this.entries = [...builtins];
  }

  register(heuristic: HeaderHeuristic): void {
    this.entries.unshift(heuristic);
  }

  match(normalizedHeader: string): DomainField | undefined {
    return this.entries.find((h) => h.normalized === normalizedHeader)?.field;
  }

  getAll(): readonly HeaderHeuristic[] {
    return this.entries;
  }
}

/**
 * Default registry instance with all built-in heuristics.
 */
export const defaultHeaderHeuristicRegistry = new HeaderHeuristicRegistry();
