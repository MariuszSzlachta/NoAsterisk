import type { DateFormat } from '#features/csv-import/model/parsing/types';

import { ALL_FORMATS } from './formats/all-formats';
import { isValidDate } from './formats/is-valid-date';

export const detectDateFormat = (
  samples: readonly string[],
): DateFormat | null => {
  const trimmed = samples.map((s) => s.trim()).filter((s) => s.length > 0);
  if (trimmed.length === 0) {
    return null;
  }

  const match = ALL_FORMATS.find((fmt) =>
    trimmed.every((sample) => {
      const m = sample.match(fmt.regex);
      if (!m) {
        return false;
      }
      const parsed = fmt.parse(m);
      return (
        parsed !== null && isValidDate(parsed.year, parsed.month, parsed.day)
      );
    }),
  );

  return match?.format ?? null;
};
