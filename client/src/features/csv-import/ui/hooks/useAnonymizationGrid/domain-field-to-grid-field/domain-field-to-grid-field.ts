import type { DomainField } from '#features/csv-import/model/types';
import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';

export const DOMAIN_FIELD_TO_GRID_FIELD: Partial<
  Record<DomainField, keyof AnonymizationGridRow>
> = {
  date: 'date',
  title: 'title',
  amount: 'amount',
  currency: 'currency',
  balance: 'balance',
  category: 'category',
};
