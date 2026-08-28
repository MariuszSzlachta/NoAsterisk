import type { NumericFormatDef } from '#features/csv-import/model/parsing/types/numeric-format-def';

import { resolveYear } from '#features/csv-import/model/parsing/date-parser/formats/resolve-year';

export const NUMERIC_FORMATS: readonly NumericFormatDef[] = [
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
