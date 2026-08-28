import type { DomainField } from '#features/csv-import/model/types';

export const DOMAIN_FIELD_HEADER_I18N: Record<DomainField, string> = {
  date: 'import.grid.date',
  title: 'import.grid.title',
  amount: 'import.grid.amount',
  currency: 'import.grid.currency',
  balance: 'import.grid.balance',
  category: 'import.grid.category',
  debit: 'import.grid.debit',
  credit: 'import.grid.credit',
  source: 'import.grid.source',
  recipient: 'import.grid.recipient',
  reference: 'import.grid.reference',
  counterpart: 'import.grid.counterpart',
};
