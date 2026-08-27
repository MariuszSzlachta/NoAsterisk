import { describe, expect, it } from 'vitest';

import {
  countTrailingEmpties,
  countTrailingEmptiesInRow,
  CsvParseError,
  generatePositionalHeaders,
  normalizeTrailingSeparator,
  tokensToRow,
  validateFile,
} from '.';

const createFile = (content: string, name: string, size?: number): File => {
  const file = new File([content], name, { type: 'text/csv' });
  if (size !== undefined) {
    Object.defineProperty(file, 'size', { value: size });
  }
  return file;
};

describe('validateFile', () => {
  it('accepts a valid .csv file', () => {
    const file = createFile('a,b,c', 'data.csv');
    expect(() => validateFile(file)).not.toThrow();
  });

  it('accepts uppercase .CSV extension', () => {
    const file = createFile('a,b,c', 'DATA.CSV');
    expect(() => validateFile(file)).not.toThrow();
  });

  it('throws INVALID_EXTENSION for non-.csv file', () => {
    const file = createFile('data', 'file.txt');
    expect(() => validateFile(file)).toThrow(CsvParseError);
    try {
      validateFile(file);
    } catch (err) {
      expect((err as CsvParseError).code).toBe('INVALID_EXTENSION');
      expect((err as CsvParseError).message).toBe(
        'Only .csv files are supported',
      );
    }
  });

  it('throws EMPTY_FILE for zero-size file', () => {
    const file = createFile('', 'empty.csv', 0);
    expect(() => validateFile(file)).toThrow(CsvParseError);
    try {
      validateFile(file);
    } catch (err) {
      expect((err as CsvParseError).code).toBe('EMPTY_FILE');
    }
  });

  it('throws FILE_TOO_LARGE for file exceeding 10 MB', () => {
    const file = createFile('a', 'big.csv', 11 * 1024 * 1024);
    expect(() => validateFile(file)).toThrow(CsvParseError);
    try {
      validateFile(file);
    } catch (err) {
      expect((err as CsvParseError).code).toBe('FILE_TOO_LARGE');
      expect((err as CsvParseError).message).toContain('10 MB');
    }
  });

  it('accepts file exactly at 10 MB', () => {
    const file = createFile('a', 'exact.csv', 10 * 1024 * 1024);
    expect(() => validateFile(file)).not.toThrow();
  });
});

describe('generatePositionalHeaders', () => {
  it('uses trimmed values as headers', () => {
    const result = generatePositionalHeaders(['Date', 'Amount', 'Description']);
    expect(result).toEqual(['Date', 'Amount', 'Description']);
  });

  it('trims whitespace from values', () => {
    const result = generatePositionalHeaders(['  Date  ', ' Amount ']);
    expect(result).toEqual(['Date', 'Amount']);
  });

  it('generates Column N for empty values', () => {
    const result = generatePositionalHeaders(['', 'Amount', '', 'Currency']);
    expect(result).toEqual(['Column 1', 'Amount', 'Column 3', 'Currency']);
  });

  it('generates Column N for whitespace-only values', () => {
    const result = generatePositionalHeaders(['   ', '  ']);
    expect(result).toEqual(['Column 1', 'Column 2']);
  });

  it('returns empty array for empty input', () => {
    const result = generatePositionalHeaders([]);
    expect(result).toEqual([]);
  });
});

describe('countTrailingEmpties', () => {
  it('returns 0 when no trailing empties', () => {
    expect(countTrailingEmpties(['A', 'B', 'C'])).toBe(0);
  });

  it('counts single trailing empty', () => {
    expect(countTrailingEmpties(['A', 'B', ''])).toBe(1);
  });

  it('counts multiple trailing empties', () => {
    expect(countTrailingEmpties(['A', '', '', ''])).toBe(3);
  });

  it('returns -1 when all values are empty', () => {
    expect(countTrailingEmpties(['', '', ''])).toBe(-1);
  });

  it('returns -1 for empty array (findIndex on empty)', () => {
    expect(countTrailingEmpties([])).toBe(-1);
  });

  it('ignores leading empties', () => {
    expect(countTrailingEmpties(['', 'A', 'B'])).toBe(0);
  });
});

describe('countTrailingEmptiesInRow', () => {
  it('returns 0 when no trailing empties', () => {
    expect(countTrailingEmptiesInRow(['A', 'B', 'C'])).toBe(0);
  });

  it('counts single trailing empty', () => {
    expect(countTrailingEmptiesInRow(['A', 'B', ''])).toBe(1);
  });

  it('counts multiple trailing empties', () => {
    expect(countTrailingEmptiesInRow(['A', '', '', ''])).toBe(3);
  });

  it('returns full length when all values are empty', () => {
    expect(countTrailingEmptiesInRow(['', '', ''])).toBe(3);
  });

  it('returns 0 for empty array', () => {
    expect(countTrailingEmptiesInRow([])).toBe(0);
  });

  it('ignores leading empties', () => {
    expect(countTrailingEmptiesInRow(['', 'A', 'B'])).toBe(0);
  });
});

describe('normalizeTrailingSeparator', () => {
  it('strips consistent trailing empty columns', () => {
    const headers = ['A', 'B', ''] as const;
    const dataRows = [
      ['1', '2', ''],
      ['3', '4', ''],
      ['5', '6', ''],
    ];

    const result = normalizeTrailingSeparator(headers, dataRows);

    expect(result.headers).toEqual(['A', 'B']);
    expect(result.dataRows).toEqual([
      ['1', '2'],
      ['3', '4'],
      ['5', '6'],
    ]);
  });

  it('returns unchanged when no trailing empties in headers', () => {
    const headers = ['A', 'B', 'C'];
    const dataRows = [['1', '2', '3']];

    const result = normalizeTrailingSeparator(headers, dataRows);

    expect(result.headers).toEqual(['A', 'B', 'C']);
    expect(result.dataRows).toEqual([['1', '2', '3']]);
  });

  it('returns unchanged when data rows have inconsistent trailing empties', () => {
    const headers = ['A', 'B', ''];
    const dataRows = [
      ['1', '2', ''],
      ['3', '4', 'X'], // not empty — inconsistent
      ['5', '6', ''],
      ['7', '8', 'Y'], // not empty — inconsistent
      ['9', '10', ''],
    ];

    const result = normalizeTrailingSeparator(headers, dataRows);

    // 3/5 = 0.6 < 0.8 threshold → no stripping
    expect(result.headers).toEqual(['A', 'B', '']);
    expect(result.dataRows).toEqual(dataRows);
  });

  it('strips when data consistency is at threshold (80%)', () => {
    const headers = ['A', 'B', ''];
    const dataRows = [
      ['1', '2', ''],
      ['3', '4', ''],
      ['5', '6', ''],
      ['7', '8', ''],
      ['9', '10', 'X'], // 1 out of 5 non-empty = 80% consistent
    ];

    const result = normalizeTrailingSeparator(headers, dataRows);

    expect(result.headers).toEqual(['A', 'B']);
  });

  it('handles multiple trailing empty columns', () => {
    const headers = ['A', '', ''];
    const dataRows = [
      ['1', '', ''],
      ['2', '', ''],
    ];

    const result = normalizeTrailingSeparator(headers, dataRows);

    expect(result.headers).toEqual(['A']);
    expect(result.dataRows).toEqual([['1'], ['2']]);
  });
});

describe('tokensToRow', () => {
  it('maps tokens to headers by index', () => {
    const headers = ['Date', 'Amount', 'Description'];
    const tokens = ['2026-01-01', '100.00', 'Groceries'];

    const result = tokensToRow(headers, tokens);

    expect(result).toEqual({
      Date: '2026-01-01',
      Amount: '100.00',
      Description: 'Groceries',
    });
  });

  it('uses empty string for missing tokens', () => {
    const headers = ['A', 'B', 'C'];
    const tokens = ['1'];

    const result = tokensToRow(headers, tokens);

    expect(result).toEqual({ A: '1', B: '', C: '' });
  });

  it('ignores extra tokens beyond header count', () => {
    const headers = ['A', 'B'];
    const tokens = ['1', '2', '3', '4'];

    const result = tokensToRow(headers, tokens);

    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('returns empty object for empty headers', () => {
    const result = tokensToRow([], ['1', '2']);
    expect(result).toEqual({});
  });
});
