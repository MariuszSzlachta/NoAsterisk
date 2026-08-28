import { isDataLine } from '#features/csv-import/model/parsing/data-boundary-detector/helpers/is-data-line';
import { MAX_SCAN_LINES } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-scan-lines';

export const findFirstDataRow = (
  lines: readonly string[],
  separator: string,
): number =>
  lines
    .slice(0, MAX_SCAN_LINES)
    .findIndex((line) => isDataLine(line, separator));
