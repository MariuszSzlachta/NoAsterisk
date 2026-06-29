import { describe, expect, it } from 'vitest';

import { detectDateFormat, parseDate } from './date-parser';

describe('detectDateFormat', () => {
  it('detects YYYY-MM-DD (ISO)', () => {
    const samples = ['2026-06-26', '2026-01-15', '2026-12-31'];
    expect(detectDateFormat(samples)).toBe('YYYY-MM-DD');
  });

  it('detects DD.MM.YYYY (most PL banks)', () => {
    const samples = ['26.06.2026', '15.01.2026', '31.12.2026'];
    expect(detectDateFormat(samples)).toBe('DD.MM.YYYY');
  });

  it('detects DD/MM/YYYY', () => {
    const samples = ['26/06/2026', '15/01/2026', '31/12/2026'];
    expect(detectDateFormat(samples)).toBe('DD/MM/YYYY');
  });

  it('detects DD-MM-YYYY', () => {
    const samples = ['26-06-2026', '15-01-2026', '31-12-2026'];
    expect(detectDateFormat(samples)).toBe('DD-MM-YYYY');
  });

  it('returns null for unrecognized format', () => {
    const samples = ['Jun 26, 2026', 'Jan 15, 2026'];
    expect(detectDateFormat(samples)).toBeNull();
  });

  it('returns null for empty samples', () => {
    expect(detectDateFormat([])).toBeNull();
  });

  it('rejects invalid dates (day 32)', () => {
    const samples = ['32.01.2026', '15.01.2026'];
    expect(detectDateFormat(samples)).toBeNull();
  });
});

describe('parseDate', () => {
  it('parses DD.MM.YYYY to ISO', () => {
    expect(parseDate('26.06.2026', 'DD.MM.YYYY')).toBe('2026-06-26');
  });

  it('parses YYYY-MM-DD (passthrough)', () => {
    expect(parseDate('2026-01-15', 'YYYY-MM-DD')).toBe('2026-01-15');
  });

  it('parses DD/MM/YYYY', () => {
    expect(parseDate('31/12/2026', 'DD/MM/YYYY')).toBe('2026-12-31');
  });

  it('returns null for invalid date', () => {
    expect(parseDate('31.13.2026', 'DD.MM.YYYY')).toBeNull();
  });

  it('returns null for wrong format', () => {
    expect(parseDate('2026-01-15', 'DD.MM.YYYY')).toBeNull();
  });
});
