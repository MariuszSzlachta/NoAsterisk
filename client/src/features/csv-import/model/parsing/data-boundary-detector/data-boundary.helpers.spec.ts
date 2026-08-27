import { describe, expect, it } from 'vitest';

import {
  classifyHeader,
  fallbackKeywordDetection,
  findFirstDataRow,
  isDataLine,
  isDateValue,
  isHeaderLine,
  walkBackToCandidate,
} from './data-boundary.detector';

describe('isDateValue', () => {
  describe('valid dates', () => {
    it.each([
      ['15.06.2025', 'DD.MM.YYYY'],
      ['01.01.2000', 'DD.MM.YYYY leading zeros'],
      ['31.12.2099', 'DD.MM.YYYY end of range'],
      ['2025-06-15', 'YYYY-MM-DD'],
      ['2025/06/15', 'YYYY/MM/DD'],
      ['15/06/25', 'DD/MM/YY'],
      ['01.01.00', 'DD.MM.YY zero year'],
      ['31-12-99', 'DD-MM-YY max two-digit year'],
    ])('returns true for %s (%s)', (value) => {
      expect(isDateValue(value)).toBe(true);
    });

    it('strips surrounding quotes before matching', () => {
      expect(isDateValue('"15.06.2025"')).toBe(true);
    });

    it('trims whitespace before matching', () => {
      expect(isDateValue('  2025-06-15  ')).toBe(true);
    });
  });

  describe('invalid values', () => {
    it.each([
      ['1.2.3', 'version number'],
      ['10.20.30', 'invalid month/day ranges'],
      ['-87,43', 'negative amount'],
      ['3840,67', 'positive amount'],
      ['100.00', 'decimal amount'],
      ['BIEDRONKA', 'text'],
      ['', 'empty string'],
      ['abc.def.ghi', 'non-numeric parts'],
      ['2025-13-01', 'month 13 out of range'],
      ['2025-06-32', 'day 32 out of range'],
      ['00.06.2025', 'day 0 out of range'],
      ['15.00.2025', 'month 0 out of range'],
      ['1899-06-15', 'year below MIN_YEAR'],
      ['2100-06-15', 'year above MAX_YEAR'],
    ])('returns false for %s (%s)', (value) => {
      expect(isDateValue(value)).toBe(false);
    });
  });
});

describe('isHeaderLine', () => {
  describe('lines with keywords', () => {
    it('returns true when line contains at least 2 keywords', () => {
      expect(isHeaderLine('Data operacji;Opis;Kwota;Saldo', ';')).toBe(true);
    });

    it('returns true for English keywords', () => {
      expect(isHeaderLine('date,description,amount,balance', ',')).toBe(true);
    });

    it('returns true for mBank-style # prefixed header', () => {
      expect(isHeaderLine('#Data operacji;Opis;Kwota;Saldo', ';')).toBe(true);
    });
  });

  describe('lines with dates (should be false)', () => {
    it('returns false when first fields contain dates', () => {
      expect(isHeaderLine('15.06.2025;Data;Kwota;Saldo', ';')).toBe(false);
    });

    it('returns false for data rows even with keyword-like text', () => {
      expect(
        isHeaderLine('2025-06-15;description of balance;-100;500', ';'),
      ).toBe(false);
    });
  });

  describe('short lines', () => {
    it('returns false when fewer than MIN_COLUMNS fields', () => {
      expect(isHeaderLine('Data', ';')).toBe(false);
    });

    it('returns false for single keyword', () => {
      expect(isHeaderLine('date', ',')).toBe(false);
    });
  });

  it('returns false when only 1 keyword hit', () => {
    expect(isHeaderLine('date;foo;bar;baz', ';')).toBe(false);
  });
});

describe('isDataLine', () => {
  describe('lines with dates in first 2 fields', () => {
    it('returns true when field[0] is a date', () => {
      expect(isDataLine('15.06.2025;BIEDRONKA;-87,43;3840,67', ';')).toBe(true);
    });

    it('returns true when field[1] is a date', () => {
      expect(isDataLine('TX001;15.06.2025;BIEDRONKA;-87,43', ';')).toBe(true);
    });

    it('returns true for ISO dates', () => {
      expect(isDataLine('2025-06-15;Payment;-100.00;500.00', ';')).toBe(true);
    });
  });

  describe('lines without dates', () => {
    it('returns false when no date in first 2 fields', () => {
      expect(isDataLine('BIEDRONKA;grocery;-87,43;3840,67', ';')).toBe(false);
    });

    it('returns false for empty lines', () => {
      expect(isDataLine('', ';')).toBe(false);
      expect(isDataLine('   ', ';')).toBe(false);
    });

    it('returns false for lines with too few columns', () => {
      expect(isDataLine('15.06.2025;BIEDRONKA', ';')).toBe(false);
    });

    it('returns false for header lines', () => {
      expect(isDataLine('Data;Opis;Kwota', ';')).toBe(false);
    });
  });
});

describe('findFirstDataRow', () => {
  it('returns index of first line matching data pattern', () => {
    const lines = [
      'Bank Name',
      'Data;Opis;Kwota;Saldo',
      '15.06.2025;BIEDRONKA;-87,43;3840,67',
      '14.06.2025;ZUS;-2635,98;3928,10',
    ];
    expect(findFirstDataRow(lines, ';')).toBe(2);
  });

  it('returns 0 when first line is data', () => {
    const lines = [
      '15.06.2025;BIEDRONKA;-87,43;3840,67',
      '14.06.2025;ZUS;-2635,98;3928,10',
    ];
    expect(findFirstDataRow(lines, ';')).toBe(0);
  });

  it('returns -1 when no data lines found', () => {
    const lines = ['Bank Name', 'Account: 123', 'Some metadata'];
    expect(findFirstDataRow(lines, ';')).toBe(-1);
  });

  it('skips empty lines', () => {
    const lines = ['', '', '15.06.2025;BIEDRONKA;-87,43;3840,67'];
    expect(findFirstDataRow(lines, ';')).toBe(2);
  });
});

describe('walkBackToCandidate', () => {
  it('returns index of last non-empty line before fromIndex', () => {
    const lines = [
      'Bank Name',
      'Data;Opis;Kwota;Saldo',
      '15.06.2025;BIEDRONKA;-87,43;3840,67',
    ];
    expect(walkBackToCandidate(lines, 2)).toBe(1);
  });

  it('skips empty lines when walking back', () => {
    const lines = [
      'Bank Name',
      'Data;Opis;Kwota;Saldo',
      '',
      '',
      '15.06.2025;BIEDRONKA;-87,43;3840,67',
    ];
    expect(walkBackToCandidate(lines, 4)).toBe(1);
  });

  it('returns null when no non-empty lines before fromIndex', () => {
    const lines = ['', '', '15.06.2025;BIEDRONKA;-87,43;3840,67'];
    expect(walkBackToCandidate(lines, 2)).toBeNull();
  });

  it('returns null when fromIndex is 0', () => {
    const lines = ['15.06.2025;BIEDRONKA;-87,43;3840,67'];
    expect(walkBackToCandidate(lines, 0)).toBeNull();
  });

  it('returns first line when it is the only non-empty one', () => {
    const lines = [
      'Data;Opis;Kwota;Saldo',
      '',
      '',
      '15.06.2025;BIEDRONKA;-87,43;3840,67',
    ];
    expect(walkBackToCandidate(lines, 3)).toBe(0);
  });
});

describe('classifyHeader', () => {
  const headerLine = 'Data operacji;Opis;Kwota;Saldo';
  const metadataLine = 'mBank S.A.';

  it('returns candidate index when candidate is a keyword header', () => {
    const lines = [headerLine, '15.06.2025;BIEDRONKA;-87,43;3840,67'];
    expect(classifyHeader(lines, 0, ';')).toBe(0);
  });

  it('returns null when candidate has no keywords', () => {
    const lines = [metadataLine, '15.06.2025;BIEDRONKA;-87,43;3840,67'];
    expect(classifyHeader(lines, 0, ';')).toBeNull();
  });

  it('returns null when candidate is null', () => {
    const lines = ['15.06.2025;BIEDRONKA;-87,43;3840,67'];
    expect(classifyHeader(lines, null, ';')).toBeNull();
  });

  describe('deeper search', () => {
    it('searches earlier lines when candidate is not a header', () => {
      const lines = [
        headerLine,
        metadataLine,
        '15.06.2025;BIEDRONKA;-87,43;3840,67',
      ];
      expect(classifyHeader(lines, 1, ';')).toBe(0);
    });

    it('returns last matching header when multiple exist before candidate', () => {
      const lines = [
        'date;description;amount;balance',
        headerLine,
        metadataLine,
        '15.06.2025;BIEDRONKA;-87,43;3840,67',
      ];
      expect(classifyHeader(lines, 2, ';')).toBe(1);
    });

    it('returns null when deeper search finds nothing', () => {
      const lines = [
        'Some metadata',
        'More metadata',
        metadataLine,
        '15.06.2025;BIEDRONKA;-87,43;3840,67',
      ];
      expect(classifyHeader(lines, 2, ';')).toBeNull();
    });
  });
});

describe('fallbackKeywordDetection', () => {
  it('finds the line with highest keyword score as header', () => {
    const lines = [
      'mBank S.A.',
      'Rachunek: 1234567890',
      'Data operacji;Opis;Kwota;Saldo',
      'Some random text',
    ];

    const result = fallbackKeywordDetection(lines, ';');
    expect(result.headerRow).toBe(2);
    expect(result.dataStartRow).toBe(3);
    expect(result.skipRows).toBe(2);
  });

  it('returns index 0 when all lines score equally low', () => {
    const lines = [
      'random text alpha',
      'random text beta',
      'random text gamma',
    ];

    const result = fallbackKeywordDetection(lines, ';');
    expect(result.headerRow).toBe(0);
    expect(result.dataStartRow).toBe(1);
    expect(result.skipRows).toBe(0);
  });

  it('skips empty lines and lines with too few columns', () => {
    const lines = ['', 'x', 'Data operacji;Opis;Kwota;Saldo'];

    const result = fallbackKeywordDetection(lines, ';');
    expect(result.headerRow).toBe(2);
  });

  it('includes dataText from headerRow onward', () => {
    const lines = [
      'metadata',
      'date;description;amount;balance',
      'row1',
      'row2',
    ];

    const result = fallbackKeywordDetection(lines, ';');
    expect(result.dataText).toBe('date;description;amount;balance\nrow1\nrow2');
  });

  it('prefers line with more keyword hits', () => {
    const lines = [
      'date;amount',
      'date;description;amount;balance;type;currency',
    ];

    const result = fallbackKeywordDetection(lines, ';');
    expect(result.headerRow).toBe(1);
  });
});
