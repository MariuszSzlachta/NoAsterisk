import type { DateFormat } from '../types';

// ─── i18n Month Registry ─────────────────────────────────────────

interface MonthLocale {
  readonly id: string;
  readonly months: Readonly<Record<string, number>>;
}

const PL_LOCALE: MonthLocale = {
  id: 'pl',
  months: {
    // Abbreviations
    sty: 1, lut: 2, mar: 3, kwi: 4, maj: 5, cze: 6,
    lip: 7, sie: 8, wrz: 9, paź: 10, paz: 10, lis: 11, gru: 12,
    // Full names
    styczeń: 1, styczen: 1, luty: 2, marzec: 3, kwiecień: 4, kwiecien: 4,
    czerwiec: 6, lipiec: 7, sierpień: 8, sierpien: 8,
    wrzesień: 9, wrzesien: 9, październik: 10, pazdziernik: 10,
    listopad: 11, grudzień: 12, grudzien: 12,
  },
};

const EN_LOCALE: MonthLocale = {
  id: 'en',
  months: {
    // Abbreviations
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    // Full names
    january: 1, february: 2, march: 3, april: 4,
    june: 6, july: 7, august: 8, september: 9,
    october: 10, november: 11, december: 12,
  },
};

const DE_LOCALE: MonthLocale = {
  id: 'de',
  months: {
    // Abbreviations
    jan: 1, feb: 2, mär: 3, mar: 3, apr: 4, mai: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, okt: 10, nov: 11, dez: 12,
    // Full names
    januar: 1, februar: 2, märz: 3, marz: 3, april: 4,
    juni: 6, juli: 7, august: 8, september: 9,
    oktober: 10, november: 11, dezember: 12,
  },
};

/**
 * Month locale registry. Add new locales here to support additional languages.
 * Lookup is case-insensitive, checked in order (PL first for Polish bank CSVs).
 */
const MONTH_LOCALES: readonly MonthLocale[] = [PL_LOCALE, EN_LOCALE, DE_LOCALE];

const resolveMonth = (monthStr: string): number | null => {
  const lower = monthStr.toLowerCase();
  for (const locale of MONTH_LOCALES) {
    const month = locale.months[lower];
    if (month !== undefined) {
      return month;
    }
  }
  return null;
};

const resolveYear = (yearStr: string): number | null => {
  const num = parseInt(yearStr, 10);
  if (isNaN(num)) {
    return null;
  }
  return num < 100 ? 2000 + num : num;
};

// ─── Data-Driven Format Definitions ──────────────────────────────

interface NumericFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly groups: { readonly year: number; readonly month: number; readonly day: number };
  readonly yearResolver?: (s: string) => number | null;
}

interface MonthNameFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (match: RegExpMatchArray) => { year: number; month: number; day: number } | null;
}

const createNumericParser = (def: NumericFormatDef): {
  format: DateFormat;
  regex: RegExp;
  parse: (m: RegExpMatchArray) => { year: number; month: number; day: number } | null;
} => ({
  format: def.format,
  regex: def.regex,
  parse: (m) => {
    const y = m[def.groups.year];
    const mo = m[def.groups.month];
    const d = m[def.groups.day];
    if (y === undefined || mo === undefined || d === undefined) {
      return null;
    }
    const year = def.yearResolver ? def.yearResolver(y) : +y;
    if (year === null) {
      return null;
    }
    return { year, month: +mo, day: +d };
  },
});

const NUMERIC_FORMATS: readonly NumericFormatDef[] = [
  { format: 'YYYY-MM-DD', regex: /^(\d{4})-(\d{2})-(\d{2})$/, groups: { year: 1, month: 2, day: 3 } },
  { format: 'DD.MM.YYYY', regex: /^(\d{2})\.(\d{2})\.(\d{4})$/, groups: { year: 3, month: 2, day: 1 } },
  { format: 'DD/MM/YYYY', regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, groups: { year: 3, month: 2, day: 1 } },
  { format: 'DD-MM-YYYY', regex: /^(\d{2})-(\d{2})-(\d{4})$/, groups: { year: 3, month: 2, day: 1 } },
  { format: 'YYYY/MM/DD', regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, groups: { year: 1, month: 2, day: 3 } },
  { format: 'DD.MM.YY', regex: /^(\d{2})\.(\d{2})\.(\d{2})$/, groups: { year: 3, month: 2, day: 1 }, yearResolver: resolveYear },
  { format: 'DD/MM/YY', regex: /^(\d{2})\/(\d{2})\/(\d{2})$/, groups: { year: 3, month: 2, day: 1 }, yearResolver: resolveYear },
];

const MONTH_NAME_FORMATS: readonly MonthNameFormatDef[] = [
  // DD-MMM-YYYY (05-CZE-2025, 14-Januar-2025, 01-Październik-2025)
  {
    format: 'DD-MMM-YYYY',
    regex: /^(\d{2})-([A-Za-zÄäÖöÜüßĄąĆćĘęŁłŃńÓóŚśŹźŻż]{3,12})-(\d{4})$/,
    parse: (m) => {
      const dayStr = m[1];
      const monthStr = m[2];
      const yearStr = m[3];
      if (dayStr === undefined || monthStr === undefined || yearStr === undefined) {
        return null;
      }
      const month = resolveMonth(monthStr);
      if (month === null) {
        return null;
      }
      return { year: +yearStr, month, day: +dayStr };
    },
  },
  // DD Mon YYYY (10 Jun 2025, 10 Juni 2025, 10 Czerwiec 2025)
  {
    format: 'DD Mon YYYY',
    regex: /^(\d{1,2})\s+([A-Za-zÄäÖöÜüßĄąĆćĘęŁłŃńÓóŚśŹźŻż]{3,12})\s+(\d{4})$/,
    parse: (m) => {
      const dayStr = m[1];
      const monthStr = m[2];
      const yearStr = m[3];
      if (dayStr === undefined || monthStr === undefined || yearStr === undefined) {
        return null;
      }
      const month = resolveMonth(monthStr);
      if (month === null) {
        return null;
      }
      return { year: +yearStr, month, day: +dayStr };
    },
  },
];

// Build unified format list
interface ParseableDateFormat {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (m: RegExpMatchArray) => { year: number; month: number; day: number } | null;
}

const ALL_FORMATS: readonly ParseableDateFormat[] = [
  ...NUMERIC_FORMATS.map(createNumericParser),
  ...MONTH_NAME_FORMATS,
];

// ─── Validation ──────────────────────────────────────────────────

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

// ─── Public API ──────────────────────────────────────────────────

/**
 * Auto-detect date format from sample values.
 * Returns the format where ALL samples parse to valid dates.
 */
export const detectDateFormat = (
  samples: readonly string[],
): DateFormat | null => {
  const trimmed = samples.map((s) => s.trim()).filter((s) => s.length > 0);
  if (trimmed.length === 0) {
    return null;
  }

  for (const fmt of ALL_FORMATS) {
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
 * Uses exact format match — the format MUST correspond to the regex.
 */
export const parseDate = (value: string, format: DateFormat): string | null => {
  const trimmed = value.trim();

  // Find ALL entries matching this format (there should be exactly one per unique DateFormat)
  const fmt = ALL_FORMATS.find((f) => f.format === format);
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

/**
 * Flexible date parser: tries all known formats until one succeeds.
 * Use for files with mixed date formats.
 */
export const parseDateFlexible = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  for (const fmt of ALL_FORMATS) {
    const match = trimmed.match(fmt.regex);
    if (!match) {
      continue;
    }
    const parsed = fmt.parse(match);
    if (parsed === null) {
      continue;
    }
    if (isValidDate(parsed.year, parsed.month, parsed.day)) {
      return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
    }
  }

  return null;
};
