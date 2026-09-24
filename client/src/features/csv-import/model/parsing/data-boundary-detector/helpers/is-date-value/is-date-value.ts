import { MAX_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/max-year';
import { MIN_YEAR } from '#features/csv-import/model/parsing/data-boundary-detector/constants/min-year';
import { parseDateFlexible } from '#features/csv-import/model/parsing/date-parser/parse-date-flexible';
import { SURROUNDING_QUOTES_PATTERN } from '#features/csv-import/model/parsing/shared/patterns/surrounding-quotes.pattern';

export const isDateValue = (value: string): boolean => {
  const trimmed = value.trim().replace(SURROUNDING_QUOTES_PATTERN, '');
  const parsed = parseDateFlexible(trimmed);
  if (parsed === null) {
    return false;
  }

  const year = Number(parsed.slice(0, 4));
  return year >= MIN_YEAR && year <= MAX_YEAR;
};
