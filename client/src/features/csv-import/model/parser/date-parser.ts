import type { DateFormat } from '../types';

interface DateFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (match: RegExpMatchArray) => {
    year: number;
    month: number;
    day: number;
  } | null;
}

const FORMATS: readonly DateFormatDef[] = [
  {
    format: 'YYYY-MM-DD',
    regex: /^(\d{4})-(\d{2})-(\d{2})$/,
    parse: (m) => {
      const year = m[1];
      const month = m[2];
      const day = m[3];
      if (year === undefined || month === undefined || day === undefined) {
        return null;
      }
      return { year: +year, month: +month, day: +day };
    },
  },
  {
    format: 'DD.MM.YYYY',
    regex: /^(\d{2})\.(\d{2})\.(\d{4})$/,
    parse: (m) => {
      const day = m[1];
      const month = m[2];
      const year = m[3];
      if (day === undefined || month === undefined || year === undefined) {
        return null;
      }
      return { year: +year, month: +month, day: +day };
    },
  },
  {
    format: 'DD/MM/YYYY',
    regex: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    parse: (m) => {
      const day = m[1];
      const month = m[2];
      const year = m[3];
      if (day === undefined || month === undefined || year === undefined) {
        return null;
      }
      return { year: +year, month: +month, day: +day };
    },
  },
  {
    format: 'DD-MM-YYYY',
    regex: /^(\d{2})-(\d{2})-(\d{4})$/,
    parse: (m) => {
      const day = m[1];
      const month = m[2];
      const year = m[3];
      if (day === undefined || month === undefined || year === undefined) {
        return null;
      }
      return { year: +year, month: +month, day: +day };
    },
  },
  // MM/DD/YYYY intentionally excluded — PL-focused app. All Polish/EU banks use DD/MM.
  // If needed in future, add disambiguation logic (check if any sample has day > 12).
];

const isValidDate = (year: number, month: number, day: number): boolean => {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
};

/**
 * Auto-detect date format from sample values.
 * Returns the format where ALL samples parse to valid dates.
 * Prefers DD/MM over MM/DD for Polish locale (ambiguous cases).
 */
export const detectDateFormat = (
  samples: readonly string[],
): DateFormat | null => {
  const trimmed = samples.map((s) => s.trim()).filter((s) => s.length > 0);
  if (trimmed.length === 0) {
    return null;
  }

  for (const fmt of FORMATS) {
    const allValid = trimmed.every((sample) => {
      const match = sample.match(fmt.regex);
      if (!match) {
        return false;
      }
      const parsed = fmt.parse(match);
      if (parsed === null) {
        return false;
      }
      return isValidDate(parsed.year, parsed.month, parsed.day);
    });
    if (allValid) {
      return fmt.format;
    }
  }

  return null;
};

/**
 * Parse a date string using a known format, returns ISO date string (YYYY-MM-DD).
 */
export const parseDate = (value: string, format: DateFormat): string | null => {
  const trimmed = value.trim();
  const fmt = FORMATS.find((f) => f.format === format);
  if (!fmt) {
    return null;
  }

  const match = trimmed.match(fmt.regex);
  if (!match) {
    return null;
  }

  const parsed = fmt.parse(match);
  if (parsed === null) {
    return null;
  }

  const { year, month, day } = parsed;
  if (!isValidDate(year, month, day)) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
