import type { MonthNameFormatDef } from '#features/csv-import/model/parsing/types/month-name-format-def';

import { UNICODE_LETTER_CLASS } from '#features/csv-import/model/parsing/date-parser/formats/all-formats/constants/unicode-letter-class';
import { parseMonthName } from '#features/csv-import/model/parsing/date-parser/locales/parse-month-name';

export const MONTH_NAME_FORMATS: readonly MonthNameFormatDef[] = [
  {
    format: 'DD-MMM-YYYY',
    regex: new RegExp(`^(\\d{2})-(${UNICODE_LETTER_CLASS}{3,12})-(\\d{4})$`),
    parse: parseMonthName,
  },
  {
    format: 'DD Mon YYYY',
    regex: new RegExp(
      `^(\\d{1,2})\\s+(${UNICODE_LETTER_CLASS}{3,12})\\s+(\\d{4})$`,
    ),
    parse: parseMonthName,
  },
];
