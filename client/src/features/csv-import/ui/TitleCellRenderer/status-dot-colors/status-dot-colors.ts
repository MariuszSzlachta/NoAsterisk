import type { AnonymizationStatus } from '#features/csv-import/model/types';

export const STATUS_DOT_COLORS: Record<AnonymizationStatus, string> = {
  safe: 'bg-income',
  needs_review: 'bg-warning',
  anonymized: 'bg-expense',
};
