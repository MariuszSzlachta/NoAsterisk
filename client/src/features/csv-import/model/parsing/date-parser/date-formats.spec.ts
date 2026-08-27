import { describe, expect, it } from 'vitest';

import {
  ALL_FORMATS,
  createNumericParser,
  isValidDate,
  parseMonthName,
  resolveYear,
  toIsoDateString,
} from './index';

describe('resolveYear', () => {
  it('returns 4-digit year as-is', () => {
    expect(resolveYear('2025')).toBe(2025);
  });

  it('converts 2-digit year by adding 2000', () => {
    expect(resolveYear('25')).toBe(2025);
    expect(resolveYear('00')).toBe(2000);
    expect(resolveYear('99')).toBe(2099);
  });

  it('returns null for non-numeric string', () => {
    expect(resolveYear('abc')).toBeNull();
    expect(resolveYear('')).toBeNull();
  });

  it('returns 100 as-is (not two-digit)', () => {
    expect(resolveYear('100')).toBe(100);
  });
});

describe('createNumericParser', () => {
  it('creates parser that extracts year/month/day from regex groups', () => {
    const parser = createNumericParser({
      format: 'DD.MM.YYYY',
      regex: /^(\d{2})\.(\d{2})\.(\d{4})$/,
      groups: { year: 3, month: 2, day: 1 },
    });

    const match = '15.06.2025'.match(parser.regex)!;
    expect(parser.parse(match)).toEqual({ year: 2025, month: 6, day: 15 });
  });

  it('uses yearResolver when provided', () => {
    const parser = createNumericParser({
      format: 'DD.MM.YY',
      regex: /^(\d{2})\.(\d{2})\.(\d{2})$/,
      groups: { year: 3, month: 2, day: 1 },
      yearResolver: (s) => 2000 + parseInt(s, 10),
    });

    const match = '15.06.25'.match(parser.regex)!;
    expect(parser.parse(match)).toEqual({ year: 2025, month: 6, day: 15 });
  });

  it('returns null when yearResolver returns null', () => {
    const parser = createNumericParser({
      format: 'DD.MM.YY',
      regex: /^(\d{2})\.(\d{2})\.(\d{2})$/,
      groups: { year: 3, month: 2, day: 1 },
      yearResolver: () => null,
    });

    const match = '15.06.ab'.match(/^(..)\.(..)\.(..)$/)!;
    expect(parser.parse(match)).toBeNull();
  });

  it('returns null when group is undefined (no match)', () => {
    const parser = createNumericParser({
      format: 'DD.MM.YYYY',
      regex: /^(\d{2})\.(\d{2})\.(\d{4})?$/,
      groups: { year: 3, month: 2, day: 1 },
    });

    const match = '15.06.'.match(/^(\d{2})\.(\d{2})\.(\d{4})?$/)!;
    expect(parser.parse(match)).toBeNull();
  });
});

describe('parseMonthName', () => {
  it('parses DD-MMM-YYYY match array', () => {
    const match = [
      '15-Jun-2025',
      '15',
      'Jun',
      '2025',
    ] as unknown as RegExpMatchArray;
    expect(parseMonthName(match)).toEqual({ year: 2025, month: 6, day: 15 });
  });

  it('parses Polish month name', () => {
    const match = [
      '10-Sty-2025',
      '10',
      'Sty',
      '2025',
    ] as unknown as RegExpMatchArray;
    expect(parseMonthName(match)).toEqual({ year: 2025, month: 1, day: 10 });
  });

  it('returns null for unknown month name', () => {
    const match = [
      '10-Xyz-2025',
      '10',
      'Xyz',
      '2025',
    ] as unknown as RegExpMatchArray;
    expect(parseMonthName(match)).toBeNull();
  });

  it('returns null for undefined groups', () => {
    const match = ['incomplete'] as unknown as RegExpMatchArray;
    expect(parseMonthName(match)).toBeNull();
  });
});

describe('isValidDate', () => {
  it('returns true for valid date', () => {
    expect(isValidDate(2025, 6, 15)).toBe(true);
  });

  it('returns false for month 0', () => {
    expect(isValidDate(2025, 0, 15)).toBe(false);
  });

  it('returns false for month 13', () => {
    expect(isValidDate(2025, 13, 15)).toBe(false);
  });

  it('returns false for day 0', () => {
    expect(isValidDate(2025, 6, 0)).toBe(false);
  });

  it('returns false for day 32', () => {
    expect(isValidDate(2025, 6, 32)).toBe(false);
  });

  it('returns false for Feb 30', () => {
    expect(isValidDate(2025, 2, 30)).toBe(false);
  });

  it('validates Feb 29 on leap year', () => {
    expect(isValidDate(2024, 2, 29)).toBe(true);
    expect(isValidDate(2025, 2, 29)).toBe(false);
  });
});

describe('toIsoDateString', () => {
  it('formats with zero-padded month and day', () => {
    expect(toIsoDateString(2025, 1, 5)).toBe('2025-01-05');
  });

  it('handles double-digit month and day', () => {
    expect(toIsoDateString(2025, 12, 31)).toBe('2025-12-31');
  });
});

describe('ALL_FORMATS', () => {
  it('contains all numeric and month-name formats', () => {
    const formats = ALL_FORMATS.map((f) => f.format);
    expect(formats).toContain('YYYY-MM-DD');
    expect(formats).toContain('DD.MM.YYYY');
    expect(formats).toContain('DD/MM/YYYY');
    expect(formats).toContain('DD-MM-YYYY');
    expect(formats).toContain('YYYY/MM/DD');
    expect(formats).toContain('DD.MM.YY');
    expect(formats).toContain('DD/MM/YY');
    expect(formats).toContain('DD-MMM-YYYY');
    expect(formats).toContain('DD Mon YYYY');
  });

  it('two-digit year format uses resolveYear', () => {
    const yyFormat = ALL_FORMATS.find((f) => f.format === 'DD.MM.YY')!;
    const match = '15.06.25'.match(yyFormat.regex)!;
    expect(yyFormat.parse(match)).toEqual({ year: 2025, month: 6, day: 15 });
  });
});
