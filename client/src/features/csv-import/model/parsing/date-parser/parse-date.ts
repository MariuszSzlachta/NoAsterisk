import type { DateFormat } from '#features/csv-import/model/parsing/types';

import { ALL_FORMATS } from './formats/all-formats';
import { isValidDate } from './formats/is-valid-date';
import { toIsoDateString } from './formats/to-iso-date-string';

export const parseDate = (value: string, format: DateFormat): string | null => {
  const trimmed = value.trim();
  const fmt = ALL_FORMATS.find((f) => f.format === format);
  if (!fmt) {
    return null;
  }

  const match = trimmed.match(fmt.regex);
  if (!match) {
    return null;
  }

  const parsed = fmt.parse(match);
  if (parsed === null || !isValidDate(parsed.year, parsed.month, parsed.day)) {
    return null;
  }

  return toIsoDateString(parsed.year, parsed.month, parsed.day);
};
