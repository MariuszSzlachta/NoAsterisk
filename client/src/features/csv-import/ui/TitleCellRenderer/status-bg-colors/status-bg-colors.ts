import type { AnonymizationStatus } from '#features/csv-import/model/types';

export const STATUS_BG_COLORS: Record<AnonymizationStatus, string> = {
  safe: '',
  needs_review: 'bg-warning-soft',
  anonymized: 'bg-expense-soft',
};
