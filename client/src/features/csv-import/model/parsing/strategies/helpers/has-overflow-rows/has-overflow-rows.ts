import { DEFAULT_SAMPLE_SIZE } from '#features/csv-import/model/parsing/strategies/helpers/has-overflow-rows/constants/default-sample-size';

export const hasOverflowRows = (
  dataRows: readonly (readonly string[])[],
  expectedColumnCount: number,
  sampleSize = DEFAULT_SAMPLE_SIZE,
): boolean =>
  dataRows.slice(0, sampleSize).some((row) => row.length > expectedColumnCount);
