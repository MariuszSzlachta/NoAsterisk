import { describe, expect, it } from 'vitest';

import {
  detectOverflowColumnIndex,
  hasAnchorPattern,
  hasOverflowRows,
} from '.';

describe('detectOverflowColumnIndex', () => {
  it('returns index when header matches keyword', () => {
    const headers = ['Data', 'Opis operacji', 'Kwota', 'Waluta'];
    expect(detectOverflowColumnIndex(headers)).toBe(1);
  });

  it('returns index for case-insensitive match', () => {
    const headers = ['Date', 'DESCRIPTION', 'Amount'];
    expect(detectOverflowColumnIndex(headers)).toBe(1);
  });

  it('returns index for header with leading hash (mBank style)', () => {
    const headers = ['#Data', '#Opis', '#Kwota'];
    expect(detectOverflowColumnIndex(headers)).toBe(1);
  });

  it('returns undefined when no header matches keywords', () => {
    const headers = ['Col1', 'Col2', 'Col3'];
    expect(detectOverflowColumnIndex(headers)).toBeUndefined();
  });

  it('returns first matching index when multiple match', () => {
    const headers = ['Data', 'Opis', 'Tytuł', 'Kwota'];
    expect(detectOverflowColumnIndex(headers)).toBe(1);
  });

  it('returns undefined for empty headers', () => {
    expect(detectOverflowColumnIndex([])).toBeUndefined();
  });
});

describe('hasOverflowRows', () => {
  it('returns true when rows have more columns than expected', () => {
    const rows = [
      ['a', 'b', 'c', 'd', 'e'],
      ['a', 'b', 'c'],
    ];
    expect(hasOverflowRows(rows, 3)).toBe(true);
  });

  it('returns false when all rows match expected column count', () => {
    const rows = [
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ];
    expect(hasOverflowRows(rows, 3)).toBe(false);
  });

  it('returns false when rows have fewer columns than expected', () => {
    const rows = [
      ['a', 'b'],
      ['c', 'd'],
    ];
    expect(hasOverflowRows(rows, 4)).toBe(false);
  });

  it('returns false for empty data rows', () => {
    expect(hasOverflowRows([], 3)).toBe(false);
  });

  it('respects sampleSize parameter', () => {
    const rows = [
      ['a', 'b', 'c'],
      ['a', 'b', 'c'],
      ['a', 'b', 'c', 'd', 'e'], // overflow at index 2 — beyond sampleSize=2
    ];
    expect(hasOverflowRows(rows, 3, 2)).toBe(false);
  });
});

describe('hasAnchorPattern', () => {
  it('returns true when rows start with dates and end with amounts', () => {
    const rows = [
      ['2026-01-01', 'BIEDRONKA', 'Zakupy', '-87,43', 'PLN'],
      ['2026-01-02', 'BOLT', 'Transport', '-34,20', 'PLN'],
      ['2026-01-03', 'LOTOS', 'Paliwo', '-180,62', 'PLN'],
      ['2026-01-04', 'LIDL', 'Zakupy', '-45,00', 'PLN'],
      ['2026-01-05', 'ŻABKA', 'Zakupy', '-12,30', 'PLN'],
    ];
    expect(hasAnchorPattern(rows)).toBe(true);
  });

  it('returns true with DD.MM.YYYY date format', () => {
    const rows = [
      ['01.01.2026', 'BIEDRONKA', 'Zakupy', '-87,43'],
      ['02.01.2026', 'BOLT', 'Transport', '-34,20'],
      ['03.01.2026', 'LOTOS', 'Paliwo', '-180,62'],
      ['04.01.2026', 'LIDL', 'Zakupy', '-45,00'],
      ['05.01.2026', 'ŻABKA', 'Zakupy', '-12,30'],
    ];
    expect(hasAnchorPattern(rows)).toBe(true);
  });

  it('returns false when rows lack dates at start', () => {
    const rows = [
      ['BIEDRONKA', 'Zakupy', '-87,43', 'PLN'],
      ['BOLT', 'Transport', '-34,20', 'PLN'],
      ['LOTOS', 'Paliwo', '-180,62', 'PLN'],
      ['LIDL', 'Zakupy', '-45,00', 'PLN'],
      ['ŻABKA', 'Zakupy', '-12,30', 'PLN'],
    ];
    expect(hasAnchorPattern(rows)).toBe(false);
  });

  it('returns false when rows lack amounts at end', () => {
    const rows = [
      ['2026-01-01', 'BIEDRONKA', 'Zakupy', 'notes'],
      ['2026-01-02', 'BOLT', 'Transport', 'notes'],
      ['2026-01-03', 'LOTOS', 'Paliwo', 'notes'],
      ['2026-01-04', 'LIDL', 'Zakupy', 'notes'],
      ['2026-01-05', 'ŻABKA', 'Zakupy', 'notes'],
    ];
    expect(hasAnchorPattern(rows)).toBe(false);
  });

  it('returns false for empty data rows', () => {
    expect(hasAnchorPattern([])).toBe(false);
  });

  it('ignores rows with fewer than 4 columns', () => {
    const rows = [
      ['2026-01-01', '-87,43', 'PLN'],
      ['2026-01-02', '-34,20', 'PLN'],
    ];
    expect(hasAnchorPattern(rows)).toBe(false);
  });
});
