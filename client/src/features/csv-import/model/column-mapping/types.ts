import type {
  AmountLocale,
  DateFormat,
} from '#features/csv-import/model/parsing/types';

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
  | 'counterpart'
  | 'reference';

export const MERGEABLE_FIELDS: ReadonlySet<DomainField> = new Set([
  'title',
  'source',
  'recipient',
  'counterpart',
]);

export type ColumnMapping = Partial<Record<string, DomainField>>;

export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  readonly mapping: ColumnMapping;
  readonly bankProfileId?: string;
  readonly createdAt: string;
}

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

export interface HeaderHeuristic {
  readonly normalized: string;
  readonly field: DomainField;
  readonly source: 'builtin' | 'user';
}

export interface BankSignature {
  readonly displayName: string;
  readonly headerPatterns: readonly (readonly string[])[];
}

export type NormalizeStep = (s: string) => string;

export interface HeuristicRegistry {
  readonly match: (normalizedHeader: string) => DomainField | undefined;
  readonly register: (heuristic: HeaderHeuristic) => HeuristicRegistry;
  readonly getAll: () => readonly HeaderHeuristic[];
}

export interface BankProfileRegistry {
  readonly detect: (headers: readonly string[]) => string | undefined;
  readonly register: (signature: BankSignature) => BankProfileRegistry;
  readonly getAll: () => readonly BankSignature[];
}
