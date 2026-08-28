export const DEFAULT_SAMPLE_SIZE = 10;

export const hasOverflowRows = (
  dataRows: readonly (readonly string[])[],
  expectedColumnCount: number,
  sampleSize = DEFAULT_SAMPLE_SIZE,
): boolean =>
  dataRows.slice(0, sampleSize).some((row) => row.length > expectedColumnCount);
