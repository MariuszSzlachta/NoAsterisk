import type { ParseableDateFormat } from '#features/csv-import/model/parsing/types/parseable-date-format';

import { createNumericParser } from '#features/csv-import/model/parsing/date-parser/formats/create-numeric-parser';
import { MONTH_NAME_FORMATS } from '#features/csv-import/model/parsing/date-parser/formats/month-name-formats';
import { NUMERIC_FORMATS } from '#features/csv-import/model/parsing/date-parser/formats/numeric-formats';

export const ALL_FORMATS: readonly ParseableDateFormat[] = [
  ...NUMERIC_FORMATS.map(createNumericParser),
  ...MONTH_NAME_FORMATS,
];
