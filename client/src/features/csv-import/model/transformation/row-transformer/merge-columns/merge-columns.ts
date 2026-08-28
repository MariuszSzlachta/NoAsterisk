import type { CsvRow } from '#features/csv-import/model/parsing/types/csv-row';

import { MERGE_SEPARATOR } from '#features/csv-import/model/transformation/row-transformer/constants/merge-separator';

export const mergeColumns = (row: CsvRow, columns: readonly string[]): string =>
  columns
    .map((col) => (row[col] ?? '').trim())
    .filter(Boolean)
    .join(MERGE_SEPARATOR);
