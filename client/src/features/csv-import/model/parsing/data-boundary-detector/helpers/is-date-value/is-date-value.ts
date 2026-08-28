import { DATE_DELIMITER_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/date-delimiter.pattern';
import { SURROUNDING_QUOTES_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/surrounding-quotes.pattern';

import { DATE_PATTERNS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/date-patterns';
import { EXPECTED_DATE_PARTS } from '#features/csv-import/model/parsing/data-boundary-detector/constants/expected-date-parts';
import { MAX_DAY } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-day';
import { MAX_MONTH } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-month';
import { MAX_TWO_DIGIT_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-two-digit-year';
import { MAX_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-year';
import { MIN_DAY } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-day';
import { MIN_MONTH } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-month';
import { MIN_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-year';

export const isDateValue = (value: string): boolean => {
  const trimmed = value.trim().replace(SURROUNDING_QUOTES_PATTERN, '');
  if (!DATE_PATTERNS.some((p) => p.test(trimmed))) {
    return false;
  }

  const parts = trimmed.split(DATE_DELIMITER_PATTERN).map(Number);
  if (parts.length !== EXPECTED_DATE_PARTS) {
    return false;
  }

  const [a, b, c] = parts;
  if (a === undefined || b === undefined || c === undefined) {
    return false;
  }

  if (a >= MIN_YEAR && a <= MAX_YEAR) {
    return b >= MIN_MONTH && b <= MAX_MONTH && c >= MIN_DAY && c <= MAX_DAY;
  }
  if (c >= MIN_YEAR && c <= MAX_YEAR) {
    return a >= MIN_DAY && a <= MAX_DAY && b >= MIN_MONTH && b <= MAX_MONTH;
  }
  if (
    a >= MIN_DAY &&
    a <= MAX_DAY &&
    b >= MIN_MONTH &&
    b <= MAX_MONTH &&
    c >= 0 &&
    c <= MAX_TWO_DIGIT_YEAR
  ) {
    return true;
  }

  return false;
};
