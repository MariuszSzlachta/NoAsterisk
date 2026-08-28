import type { CsvRow } from '#features/csv-import/model/parsing/types/csv-row';

export const tokensToRow = (
  headers: readonly string[],
  assembled: readonly string[],
): CsvRow => Object.fromEntries(headers.map((h, i) => [h, assembled[i] ?? '']));
