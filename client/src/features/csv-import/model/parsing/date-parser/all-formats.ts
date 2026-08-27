import type {
  MonthNameFormatDef,
  NumericFormatDef,
  ParseableDateFormat,
} from '#features/csv-import/model/parsing/types';

import { createNumericParser } from './create-numeric-parser';
import { parseMonthName } from './parse-month-name';
import { resolveYear } from './resolve-year';

const UNICODE_LETTER_CLASS = '[A-Za-zÄäÖöÜüßĄąĆćĘęŁłŃńÓóŚśŹźŻż]';

const NUMERIC_FORMATS: readonly NumericFormatDef[] = [
  {
    format: 'YYYY-MM-DD',
    regex: /^(\d{4})-(\d{2})-(\d{2})$/,
    groups: { year: 1, month: 2, day: 3 },
  },
  {
    format: 'DD.MM.YYYY',
    regex: /^(\d{2})\.(\d{2})\.(\d{4})$/,
    groups: { year: 3, month: 2, day: 1 },
  },
  {
    format: 'DD/MM/YYYY',
    regex: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    groups: { year: 3, month: 2, day: 1 },
  },
  {
    format: 'DD-MM-YYYY',
    regex: /^(\d{2})-(\d{2})-(\d{4})$/,
    groups: { year: 3, month: 2, day: 1 },
  },
  {
    format: 'YYYY/MM/DD',
    regex: /^(\d{4})\/(\d{2})\/(\d{2})$/,
    groups: { year: 1, month: 2, day: 3 },
  },
  {
    format: 'DD.MM.YY',
    regex: /^(\d{2})\.(\d{2})\.(\d{2})$/,
    groups: { year: 3, month: 2, day: 1 },
    yearResolver: resolveYear,
  },
  {
    format: 'DD/MM/YY',
    regex: /^(\d{2})\/(\d{2})\/(\d{2})$/,
    groups: { year: 3, month: 2, day: 1 },
    yearResolver: resolveYear,
  },
];

const MONTH_NAME_FORMATS: readonly MonthNameFormatDef[] = [
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

export const ALL_FORMATS: readonly ParseableDateFormat[] = [
  ...NUMERIC_FORMATS.map(createNumericParser),
  ...MONTH_NAME_FORMATS,
];
