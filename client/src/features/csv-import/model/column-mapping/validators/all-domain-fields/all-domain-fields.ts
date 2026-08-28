import type { DomainField } from '#features/csv-import/model/column-mapping/types';

export const ALL_DOMAIN_FIELDS = [
  'date',
  'title',
  'amount',
  'currency',
  'balance',
  'debit',
  'credit',
  'category',
  'source',
  'recipient',
  'counterpart',
  'reference',
] as const satisfies readonly DomainField[];
