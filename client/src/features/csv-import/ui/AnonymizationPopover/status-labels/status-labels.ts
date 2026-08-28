import type { AnonymizationStatus } from '#features/csv-import/model/types';

export const STATUS_LABELS: Record<AnonymizationStatus, string> = {
  safe: 'import.anonymization.legend.safe',
  needs_review: 'import.anonymization.legend.needsReview',
  anonymized: 'import.anonymization.legend.anonymized',
};
