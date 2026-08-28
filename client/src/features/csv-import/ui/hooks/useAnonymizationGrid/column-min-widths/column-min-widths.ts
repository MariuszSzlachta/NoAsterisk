import type { DomainField } from '#features/csv-import/model/types';

export const COLUMN_MIN_WIDTHS: Partial<Record<DomainField, number>> = {
  title: 400,
};
