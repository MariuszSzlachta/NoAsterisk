import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';
import { ROW_STATUS_CLASSES } from '#features/csv-import/ui/hooks/useAnonymizationGrid/row-status-classes';

export const getRowClass = (row: AnonymizationGridRow): string | undefined =>
  ROW_STATUS_CLASSES[row.anonymizationStatus];
