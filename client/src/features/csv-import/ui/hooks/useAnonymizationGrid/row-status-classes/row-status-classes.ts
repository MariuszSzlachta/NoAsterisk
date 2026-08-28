import type { AnonymizationStatus } from '#features/csv-import/model/types';

export const ROW_STATUS_CLASSES: Record<AnonymizationStatus, string> = {
  safe: 'anonymization-row-safe',
  needs_review: 'anonymization-row-needs-review',
  anonymized: 'anonymization-row-anonymized',
};
