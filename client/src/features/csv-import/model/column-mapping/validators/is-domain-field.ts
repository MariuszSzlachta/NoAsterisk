import type { DomainField } from '#features/csv-import/model/column-mapping/types';

/** Exhaustive list kept in sync with DomainField union via satisfies. Compiler errors on drift. */
const ALL_DOMAIN_FIELDS = [
  'date', 'title', 'amount', 'currency', 'balance', 'debit', 'credit',
  'category', 'source', 'recipient', 'counterpart', 'reference',
] as const satisfies readonly DomainField[];

const VALID_DOMAIN_FIELDS: ReadonlySet<string> = new Set(ALL_DOMAIN_FIELDS);

export const isDomainField = (value: string): value is DomainField =>
  VALID_DOMAIN_FIELDS.has(value);
