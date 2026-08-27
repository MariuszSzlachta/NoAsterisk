import type { DateFormat, MonthNameFormatDef, NumericFormatDef, ParseableDateFormat } from '#features/csv-import/model/parsing/types';
import { resolveMonth } from './month-locales';

const TWO_DIGIT_YEAR_THRESHOLD = 100;
const TWO_DIGIT_YEAR_BASE = 2000;

const resolveYear = (yearStr: string): number | null => {
  const num = parseInt(yearStr, 10);
  if (isNaN(num)) return null;
  return num < TWO_DIGIT_YEAR_THRESHOLD ? TWO_DIGIT_YEAR_BASE + num : num;
};

const createNumericParser = (def: NumericFormatDef): ParseableDateFormat => ({
  format: def.format,
  regex: def.regex,
  parse: (m) => {
    const y = m[def.groups.year];
    const mo = m[def.groups.month];
    const d = m[def.groups.day];
    if (y === undefined || mo === undefined || d === undefined) return null;
    const year = def.yearResolver ? def.yearResolver(y) : +y;
    if (year === null) return null;
    return { year, month: +mo, day: +d };
  },
});

const UNICODE_LETTER_CLASS = '[A-Za-zÄäÖöÜüßĄąĆćĘęŁłŃńÓóŚśŹźŻż]';

const NUMERIC_FORMATS: readonly NumericFormatDef[] = [
  { format: 'YYYY-MM-DD', regex: /^(\d{4})-(\d{2})-(\d{2})$/, groups: { year: 1, month: 2, day: 3 } },
  { format: 'DD.MM.YYYY', regex: /^(\d{2})\.(\d{2})\.(\d{4})$/, groups: { year: 3, month: 2, day: 1 } },
  { format: 'DD/MM/YYYY', regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, groups: { year: 3, month: 2, day: 1 } },
  { format: 'DD-MM-YYYY', regex: /^(\d{2})-(\d{2})-(\d{4})$/, groups: { year: 3, month: 2, day: 1 } },
  { format: 'YYYY/MM/DD', regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, groups: { year: 1, month: 2, day: 3 } },
  { format: 'DD.MM.YY', regex: /^(\d{2})\.(\d{2})\.(\d{2})$/, groups: { year: 3, month: 2, day: 1 }, yearResolver: resolveYear },
  { format: 'DD/MM/YY', regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, groups: { year: 3, month: 2, day: 1 }, yearResolver: resolveYear },
];

const parseMonthName = (m: RegExpMatchArray): { year: number; month: number; day: number } | null => {
  const [, dayStr, monthStr, yearStr] = m;
  if (dayStr === undefined || monthStr === undefined || yearStr === undefined) return null;
  const month = resolveMonth(monthStr);
  if (month === null) return null;
  return { year: +yearStr, month, day: +dayStr };
};

const MONTH_NAME_FORMATS: readonly MonthNameFormatDef[] = [
  {
    format: 'DD-MMM-YYYY',
    regex: new RegExp(`^(\\d{2})-(${UNICODE_LETTER_CLASS}{3,12})-(\\d{4})$`),
    parse: parseMonthName,
  },
  {
    format: 'DD Mon YYYY',
    regex: new RegExp(`^(\\d{1,2})\\s+(${UNICODE_LETTER_CLASS}{3,12})\\s+(\\d{4})$`),
    parse: parseMonthName,
  },
];

export const ALL_FORMATS: readonly ParseableDateFormat[] = [
  ...NUMERIC_FORMATS.map(createNumericParser),
  ...MONTH_NAME_FORMATS,
];

export const isValidDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
};

export const toIsoDateString = (year: number, month: number, day: number): string =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
