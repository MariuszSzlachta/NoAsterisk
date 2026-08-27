import { describe, expect, it } from 'vitest';

import { detectDateFormat, parseDate, parseDateFlexible } from './';

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

  it('detects DD-MMM-YYYY with Polish month abbreviations', () => {
    const samples = ['05-CZE-2025', '14-LIP-2025', '01-STY-2025'];
    expect(detectDateFormat(samples)).toBe('DD-MMM-YYYY');
  });

  it('detects DD-MMM-YYYY with German month abbreviations', () => {
    const samples = ['05-Jan-2025', '14-Mär-2025', '01-Okt-2025'];
    expect(detectDateFormat(samples)).toBe('DD-MMM-YYYY');
  });

  it('detects DD-MMM-YYYY with full German month names', () => {
    const samples = ['05-Januar-2025', '14-März-2025', '01-Oktober-2025'];
    expect(detectDateFormat(samples)).toBe('DD-MMM-YYYY');
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

describe('parseDateFlexible — i18n month names', () => {
  describe('Polish months', () => {
    it('parses abbreviation: 05-CZE-2025', () => {
      expect(parseDateFlexible('05-CZE-2025')).toBe('2025-06-05');
    });

    it('parses abbreviation: 14-PAŹ-2025', () => {
      expect(parseDateFlexible('14-PAŹ-2025')).toBe('2025-10-14');
    });

    it('parses full name: 10 Styczeń 2025', () => {
      expect(parseDateFlexible('10 Styczeń 2025')).toBe('2025-01-10');
    });

    it('parses full name without diacritics: 10 Styczen 2025', () => {
      expect(parseDateFlexible('10 Styczen 2025')).toBe('2025-01-10');
    });

    it('parses full name: 5 Grudzień 2025', () => {
      expect(parseDateFlexible('5 Grudzień 2025')).toBe('2025-12-05');
    });
  });

  describe('English months', () => {
    it('parses abbreviation: 10 Jun 2025', () => {
      expect(parseDateFlexible('10 Jun 2025')).toBe('2025-06-10');
    });

    it('parses full name: 10 January 2025', () => {
      expect(parseDateFlexible('10 January 2025')).toBe('2025-01-10');
    });

    it('parses full name: 25 December 2025', () => {
      expect(parseDateFlexible('25 December 2025')).toBe('2025-12-25');
    });
  });

  describe('German months', () => {
    it('parses abbreviation: 05-Jan-2025', () => {
      expect(parseDateFlexible('05-Jan-2025')).toBe('2025-01-05');
    });

    it('parses abbreviation: 14-Mär-2025', () => {
      expect(parseDateFlexible('14-Mär-2025')).toBe('2025-03-14');
    });

    it('parses abbreviation without umlaut: 14-Mar-2025', () => {
      expect(parseDateFlexible('14-Mar-2025')).toBe('2025-03-14');
    });

    it('parses abbreviation: 01-Okt-2025', () => {
      expect(parseDateFlexible('01-Okt-2025')).toBe('2025-10-01');
    });

    it('parses abbreviation: 22-Dez-2025', () => {
      expect(parseDateFlexible('22-Dez-2025')).toBe('2025-12-22');
    });

    it('parses full name: 5 Januar 2025', () => {
      expect(parseDateFlexible('5 Januar 2025')).toBe('2025-01-05');
    });

    it('parses full name: 14 März 2025', () => {
      expect(parseDateFlexible('14 März 2025')).toBe('2025-03-14');
    });

    it('parses full name: 1 Oktober 2025', () => {
      expect(parseDateFlexible('1 Oktober 2025')).toBe('2025-10-01');
    });

    it('parses full name: 22 Dezember 2025', () => {
      expect(parseDateFlexible('22 Dezember 2025')).toBe('2025-12-22');
    });

    it('parses full name without umlaut: 14 Marz 2025', () => {
      expect(parseDateFlexible('14 Marz 2025')).toBe('2025-03-14');
    });
  });
});
