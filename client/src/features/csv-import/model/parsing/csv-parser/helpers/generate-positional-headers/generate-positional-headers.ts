import { COLUMN_NAME_PREFIX } from '#features/csv-import/model/parsing/csv-parser/helpers/generate-positional-headers/constants/column-name-prefix';

export const generatePositionalHeaders = (
  firstRow: readonly string[],
): readonly string[] =>
  firstRow.map((value, i) => value.trim() || `${COLUMN_NAME_PREFIX} ${i + 1}`);
