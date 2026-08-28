import type { DomainField } from '#features/csv-import/model/column-mapping/domain-field';

export const REQUIRED_FIELDS: Readonly<Record<string, DomainField>> = {
  DATE: 'date',
  TITLE: 'title',
  AMOUNT: 'amount',
  DEBIT: 'debit',
  CREDIT: 'credit',
};
