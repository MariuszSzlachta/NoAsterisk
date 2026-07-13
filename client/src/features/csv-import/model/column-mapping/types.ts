// ═══════════════════════════════════════════════════════════════════
// Column Mapping Types — Mapping, Bank Profiles
// ═══════════════════════════════════════════════════════════════════

import type { AmountLocale, DateFormat } from '../parsing/types';

// ─── Column Mapping ──────────────────────────────────────────────

export type DomainField =
  | 'date'
  | 'title'
  | 'amount'
  | 'currency'
  | 'balance'
  | 'debit'
  | 'credit'
  | 'category'
  | 'source'
  | 'recipient'
  | 'reference';

/** Fields that accept multiple CSV columns — values are concatenated in CSV column order. */
export const MERGEABLE_FIELDS: ReadonlySet<DomainField> = new Set([
  'title',
  'source',
  'recipient',
]);

export type ColumnMapping = Partial<Record<string, DomainField>>;

export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  readonly mapping: ColumnMapping;
  readonly bankProfileId?: string;
  readonly createdAt: string;
}

// ─── Bank Profiles ───────────────────────────────────────────────

export interface BankProfile {
  readonly id: string;
  readonly bankName: string;
  readonly headerSignatures: readonly (readonly string[])[];
  readonly defaultMapping: ColumnMapping;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
  readonly encoding?: string;
  readonly separator?: string;
  readonly skipRows?: number;
}
