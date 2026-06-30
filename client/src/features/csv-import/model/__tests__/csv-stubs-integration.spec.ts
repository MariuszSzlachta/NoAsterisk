import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseAmount, detectAmountLocale } from '../parser/amount-parser';
import { detectDataBoundaries } from '../parser/data-boundary-detector';
import { parseDateFlexible } from '../parser/date-parser';
import { decodeBuffer, detectEncoding } from '../parser/encoding-detector';
import { detectSeparator } from '../parser/separator-detector';

const STUBS_DIR = resolve(__dirname, '../../../../../../stubs/csv');

const loadStub = (
  filename: string,
): { buffer: ArrayBuffer; encoding: string; text: string } => {
  const raw = readFileSync(resolve(STUBS_DIR, filename));
  const buffer = raw.buffer.slice(
    raw.byteOffset,
    raw.byteOffset + raw.byteLength,
  );
  const encoding = detectEncoding(buffer);
  let text = decodeBuffer(buffer, encoding);
  // Strip BOM
  if (text.startsWith('\uFEFF')) {
    text = text.slice(1);
  }
  return { buffer, encoding, text };
};

describe('CSV Integration: 01-easy-revolut', () => {
  const { encoding, text } = loadStub('01-easy-revolut.csv');

  it('detects UTF-8 encoding', () => {
    expect(encoding).toBe('utf-8');
  });

  it('detects comma separator', () => {
    expect(detectSeparator(text)).toBe(',');
  });

  it('has no metadata rows (header is first line)', () => {
    const boundaries = detectDataBoundaries(text, ',');
    expect(boundaries.skipRows).toBe(0);
    // footerLines = 1 is just the trailing empty line, acceptable
    expect(boundaries.footerLines).toBeLessThanOrEqual(1);
  });

  it('parses all 10 data rows', () => {
    const boundaries = detectDataBoundaries(text, ',');
    const lines = boundaries.dataText
      .split('\n')
      .filter((l) => l.trim().length > 0);
    // First line is header, rest is data
    expect(lines.length - 1).toBe(10);
  });

  it('parses amount -87.43 (EN locale)', () => {
    expect(parseAmount('-87.43', 'en')).toBe(-87.43);
  });

  it('parses ISO date 2025-06-01', () => {
    expect(parseDateFlexible('2025-06-01')).toBe('2025-06-01');
  });
});

describe('CSV Integration: 02-medium-mbank', () => {
  const { encoding, text } = loadStub('02-medium-mbank.csv');

  it('detects Windows-1250 encoding', () => {
    expect(encoding).toBe('windows-1250');
  });

  it('detects semicolon separator', () => {
    expect(detectSeparator(text)).toBe(';');
  });

  it('has no metadata rows (header has # prefix but is first line)', () => {
    const boundaries = detectDataBoundaries(text, ';');
    expect(boundaries.skipRows).toBe(0);
  });

  it('parses Polish amount with NBSP: 8 500,00', () => {
    // The \xa0 in the source is decoded as regular space after decoding
    expect(parseAmount('8 500,00', 'pl')).toBe(8500.0);
  });

  it('parses Polish amount with leading quote: \'68 1050...', () => {
    expect(parseAmount("'68", 'pl')).toBe(68);
  });

  it('parses negative amount -2 100,00', () => {
    expect(parseAmount('-2 100,00', 'pl')).toBe(-2100.0);
  });

  it('parses date DD.MM.YYYY: 15.06.2025', () => {
    expect(parseDateFlexible('15.06.2025')).toBe('2025-06-15');
  });

  it('parses Polish month date: 05-CZE-2025', () => {
    expect(parseDateFlexible('05-CZE-2025')).toBe('2025-06-05');
  });

  it('detects PL amount locale from samples', () => {
    const samples = [
      '8 500,00',
      '-14,80',
      '-2 100,00',
      '-89,00',
      '-75,00',
      '-239,99',
      '4 200,00',
      '-187,43',
      '-1 450,00',
      '-300,00',
    ];
    expect(detectAmountLocale(samples)).toBe('pl');
  });
});

describe('CSV Integration: 03-hard-pkobp', () => {
  const { encoding, text } = loadStub('03-hard-pkobp.csv');

  it('detects UTF-8 encoding', () => {
    expect(encoding).toBe('utf-8');
  });

  it('detects semicolon separator', () => {
    expect(detectSeparator(text)).toBe(';');
  });

  it('skips metadata header rows (5 lines + blank)', () => {
    const boundaries = detectDataBoundaries(text, ';');
    // Header should be "Data waluty";"Data operacji"... line
    expect(boundaries.skipRows).toBeGreaterThanOrEqual(5);
  });

  it('detects footer lines', () => {
    const boundaries = detectDataBoundaries(text, ';');
    // Footer: "Liczba operacji", "Suma uznań", "Suma obciążeń", "Saldo końcowe", "Wygenerowano", blank
    expect(boundaries.footerLines).toBeGreaterThanOrEqual(5);
  });

  it('parses amount with leading + sign: +9 200,00', () => {
    expect(parseAmount('+9 200,00', 'pl')).toBe(9200.0);
  });

  it('parses negative amount: -234,87', () => {
    expect(parseAmount('-234,87', 'pl')).toBe(-234.87);
  });

  it('parses amount -3 000,00', () => {
    expect(parseAmount('-3 000,00', 'pl')).toBe(-3000.0);
  });

  it('parses ISO date in quotes: 2025-06-01', () => {
    expect(parseDateFlexible('2025-06-01')).toBe('2025-06-01');
  });
});

describe('CSV Integration: 04-mixed-easy-structure-hard-data', () => {
  const { encoding, text } = loadStub(
    '04-mixed-easy-structure-hard-data.csv',
  );

  it('detects UTF-8 encoding', () => {
    expect(encoding).toBe('utf-8');
  });

  it('detects comma separator', () => {
    expect(detectSeparator(text)).toBe(',');
  });

  it('has no metadata rows', () => {
    const boundaries = detectDataBoundaries(text, ',');
    expect(boundaries.skipRows).toBe(0);
  });

  it('parses parentheses-negative amount: (8.50) → -8.50', () => {
    expect(parseAmount('(8.50)', 'en')).toBe(-8.50);
  });

  it('parses parentheses-negative with spaces: (2 350.00) → -2350.00', () => {
    expect(parseAmount('(2 350.00)', 'en')).toBe(-2350.0);
  });

  it('parses large amount with space: 6 200.00', () => {
    expect(parseAmount('6 200.00', 'en')).toBe(6200.0);
  });

  it('parses parentheses-negative: (189.99) → -189.99', () => {
    expect(parseAmount('(189.99)', 'en')).toBe(-189.99);
  });

  it('parses date DD/MM/YYYY: 01/06/2025', () => {
    expect(parseDateFlexible('01/06/2025')).toBe('2025-06-01');
  });

  it('parses date YYYY-MM-DD: 2025-06-03', () => {
    expect(parseDateFlexible('2025-06-03')).toBe('2025-06-03');
  });

  it('parses date DD.MM.YY (short year): 03.06.25', () => {
    expect(parseDateFlexible('03.06.25')).toBe('2025-06-03');
  });

  it('parses date YYYY/MM/DD: 2025/06/05', () => {
    expect(parseDateFlexible('2025/06/05')).toBe('2025-06-05');
  });

  it('parses date DD-MM-YYYY: 06-06-2025', () => {
    expect(parseDateFlexible('06-06-2025')).toBe('2025-06-06');
  });

  it('parses date DD Mon YYYY: 10 Jun 2025', () => {
    expect(parseDateFlexible('10 Jun 2025')).toBe('2025-06-10');
  });
});

describe('CSV Integration: 05-mixed-hard-structure-mixed-data', () => {
  const { encoding, text } = loadStub(
    '05-mixed-hard-structure-mixed-data.csv',
  );

  it('detects UTF-8 encoding', () => {
    expect(encoding).toBe('utf-8');
  });

  it('detects pipe separator', () => {
    const boundaries = detectDataBoundaries(text, detectSeparator(text));
    const sep = detectSeparator(boundaries.dataText);
    expect(sep).toBe('|');
  });

  it('skips metadata header rows (bank name, client, account, generated, ---)', () => {
    const sep = detectSeparator(text);
    const boundaries = detectDataBoundaries(text, sep);
    // Metadata: Santander, Raport, Klient, Rachunek, Wygenerowano, ---,  blank
    expect(boundaries.skipRows).toBeGreaterThanOrEqual(5);
  });

  it('detects footer lines (PODSUMOWANIE section)', () => {
    const sep = detectSeparator(text);
    const boundaries = detectDataBoundaries(text, sep);
    // Footer: blank, === PODSUMOWANIE ===, Uznania, Obciążenia, Saldo początkowe, Saldo końcowe, Dokument...
    expect(boundaries.footerLines).toBeGreaterThanOrEqual(5);
  });

  it('parses Polish amount: +8 750,00', () => {
    expect(parseAmount('+8 750,00', 'pl')).toBe(8750.0);
  });

  it('parses negative Polish amount: -112,47', () => {
    expect(parseAmount('-112,47', 'pl')).toBe(-112.47);
  });

  it('parses amount with leading space: +1 284,00', () => {
    expect(parseAmount(' +1 284,00', 'pl')).toBe(1284.0);
  });

  it('parses date DD.MM.YYYY: 01.06.2025', () => {
    expect(parseDateFlexible('01.06.2025')).toBe('2025-06-01');
  });

  it('parses Polish month date: 14-CZE-2025', () => {
    expect(parseDateFlexible('14-CZE-2025')).toBe('2025-06-14');
  });
});
