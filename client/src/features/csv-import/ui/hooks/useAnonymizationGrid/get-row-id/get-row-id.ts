import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';

export const getRowId = (row: AnonymizationGridRow): string => row.id;
