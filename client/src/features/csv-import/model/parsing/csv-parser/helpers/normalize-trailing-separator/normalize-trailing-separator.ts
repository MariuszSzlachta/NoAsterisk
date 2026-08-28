import type { TrailingNormalized } from '#features/csv-import/model/parsing/types/trailing-normalized';

import { countTrailingEmpties } from '#features/csv-import/model/parsing/csv-parser/helpers/count-trailing-empties';
import { countTrailingEmptiesInRow } from '#features/csv-import/model/parsing/csv-parser/helpers/count-trailing-empties-in-row';
import { MAX_TRAILING_SAMPLE_SIZE } from '#features/csv-import/model/parsing/csv-parser/helpers/normalize-trailing-separator/constants/max-trailing-sample-size';
import { TRAILING_CONSISTENCY_THRESHOLD } from '#features/csv-import/model/parsing/csv-parser/helpers/normalize-trailing-separator/constants/trailing-consistency-threshold';

export const normalizeTrailingSeparator = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
): TrailingNormalized => {
  const headerTrailingCount = countTrailingEmpties(headers);

  if (headerTrailingCount <= 0) {
    return { headers, dataRows };
  }

  const sample = dataRows.slice(0, MAX_TRAILING_SAMPLE_SIZE);
  const matchingCount = sample.filter(
    (row) => countTrailingEmptiesInRow(row) >= headerTrailingCount,
  ).length;

  const consistency = matchingCount / sample.length;
  if (consistency < TRAILING_CONSISTENCY_THRESHOLD) {
    return { headers, dataRows };
  }

  const strippedHeaders = headers.slice(
    0,
    headers.length - headerTrailingCount,
  );
  const strippedRows = dataRows.map((row) => {
    const toStrip = Math.min(
      countTrailingEmptiesInRow(row),
      headerTrailingCount,
    );
    return toStrip > 0 ? row.slice(0, row.length - toStrip) : row;
  });

  return { headers: strippedHeaders, dataRows: strippedRows };
};
