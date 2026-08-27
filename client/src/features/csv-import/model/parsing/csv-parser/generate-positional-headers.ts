export const generatePositionalHeaders = (
  firstRow: readonly string[],
): readonly string[] =>
  firstRow.map((value, i) => value.trim() || `Column ${i + 1}`);
