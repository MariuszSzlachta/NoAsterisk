import { isDataLine } from './is-data-line';
import { MAX_SCAN_LINES } from './constants/max-scan-lines';

export const findFirstDataRow = (
  lines: readonly string[],
  separator: string,
): number =>
  lines
    .slice(0, MAX_SCAN_LINES)
    .findIndex((line) => isDataLine(line, separator));
