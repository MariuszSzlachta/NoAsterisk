import { SURROUNDING_QUOTES_PATTERN } from '#features/csv-import/model/parsing/shared';
import { DATE_DELIMITER_PATTERN } from '#features/csv-import/model/parsing/shared';

import { DATE_PATTERNS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/date-patterns';
import { MAX_TWO_DIGIT_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-two-digit-year';
import { MAX_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-year';
import { MIN_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-year';

export const isDateValue = (value: string): boolean => {
  const trimmed = value.trim().replace(SURROUNDING_QUOTES_PATTERN, '');
  if (!DATE_PATTERNS.some((p) => p.test(trimmed))) {
    return false;
  }

  const parts = trimmed.split(DATE_DELIMITER_PATTERN).map(Number);
  if (parts.length !== 3) {
    return false;
  }

  const [a, b, c] = parts;
  if (a === undefined || b === undefined || c === undefined) {
    return false;
  }

  if (a >= MIN_YEAR && a <= MAX_YEAR) {
    return b >= 1 && b <= 12 && c >= 1 && c <= 31;
  }
  if (c >= MIN_YEAR && c <= MAX_YEAR) {
    return a >= 1 && a <= 31 && b >= 1 && b <= 12;
  }
  if (
    a >= 1 &&
    a <= 31 &&
    b >= 1 &&
    b <= 12 &&
    c >= 0 &&
    c <= MAX_TWO_DIGIT_YEAR
  ) {
    return true;
  }

  return false;
};
