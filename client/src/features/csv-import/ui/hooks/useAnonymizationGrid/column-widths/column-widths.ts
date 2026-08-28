import type { DomainField } from '#features/csv-import/model/types';

export const COLUMN_WIDTHS: Partial<Record<DomainField, number>> = {
  date: 100,
  amount: 120,
  currency: 80,
  balance: 120,
  category: 140,
};
