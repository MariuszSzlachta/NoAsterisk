/**
 * End-to-end integration tests for parseCsvFile() using real CSV stubs.
 *
 * These tests verify the FULL pipeline:
 * 1. Encoding detection + decode
 * 2. Boundary detection (metadata skip, header/data split)
 * 3. Separator detection
 * 4. Raw parse (papaparse)
 * 5. Strategy resolution (direct vs overflow-merge)
 * 6. Row reassembly
 * 7. Header→value mapping correctness
 *
 * Test classification:
 * - PASS tests = parser works correctly for this stub
 * - it.fails() tests = known bugs in the parsing pipeline, documented for architect
 *
 * więc zielony pipeline CI nie oznacza poprawnego importu. Dla krytycznego
 * a test ma stać się zwykłym `it` natychmiast po naprawie.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseCsvFile } from '#features/csv-import/model/parsing/csv-parser/parse-csv-file';

const STUBS_DIR = resolve(process.cwd(), '../stubs/csv');

/**
 * Load a CSV stub from disk and wrap in a File object (JSDOM-compatible).
 */
const loadStubAsFile = (filename: string): File => {
  const raw = readFileSync(resolve(STUBS_DIR, filename));
  const blob = new Blob([raw]);
  return new File([blob], filename, { type: 'text/csv' });
};

// ═══════════════════════════════════════════════════════════════════
// 01 — Easy: Revolut (clean CSV, comma, UTF-8, no metadata)
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 01-easy-revolut.csv', () => {
  it('parses correct headers', async () => {
    const result = await parseCsvFile(loadStubAsFile('01-easy-revolut.csv'));

    expect(result.headers).toEqual([
      'Date',
      'Description',
      'Amount',
      'Currency',
      'Original Amount',
      'Original Currency',
      'Category',
      'Counterparty',
      'Counterparty IBAN',
    ]);
  });

  it('parses all 10 data rows', async () => {
    const result = await parseCsvFile(loadStubAsFile('01-easy-revolut.csv'));
    expect(result.rowCount).toBe(10);
  });

  it('maps first row values correctly (salary)', async () => {
    const result = await parseCsvFile(loadStubAsFile('01-easy-revolut.csv'));
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Date']).toBe('2025-06-01');
    expect(row['Description']).toBe('Salary Jun 2025');
    expect(row['Amount']).toBe('8500.00');
    expect(row['Currency']).toBe('PLN');
    expect(row['Category']).toBe('Income');
    expect(row['Counterparty']).toBe('TechCorp Sp. z o.o.');
    expect(row['Counterparty IBAN']).toBe('PL61109010140000071219812874');
  });

  it('maps row with empty optional fields correctly', async () => {
    const result = await parseCsvFile(loadStubAsFile('01-easy-revolut.csv'));
    const row = result.rows[1];

    expect(row).toBeDefined();
    expect(row['Date']).toBe('2025-06-02');
    expect(row['Description']).toBe('To Biedronka Sklep 4412');
    expect(row['Amount']).toBe('-87.43');
    expect(row['Original Amount']).toBe('');
    expect(row['Counterparty IBAN']).toBe('');
  });

  it('maps last row correctly', async () => {
    const result = await parseCsvFile(loadStubAsFile('01-easy-revolut.csv'));
    const lastRow = result.rows[result.rowCount - 1];

    expect(lastRow).toBeDefined();
    expect(lastRow['Date']).toBeDefined();
    expect(lastRow['Amount']).toBeDefined();
    expect(lastRow['Currency']).toBe('PLN');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 02 — Medium: mBank (semicolon, Windows-1250, trailing separator,
//       overflow in Nadawca/Odbiorca field)
//
// KNOWN BUG: overflow-merge strategy incorrectly picks #Opis operacji
// (index 2) as overflow column. The real overflow comes from:
// - Empty #Nadawca/Odbiorca + #Numer konta producing extra semicolons
// - Semicolons INSIDE #Nadawca/Odbiorca (e.g. "NOVA DEVELOPMENT; SP. Z O.O.")
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 02-medium-mbank.csv', () => {
  it('parses correct headers', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));

    expect(result.headers).toContain('#Data operacji');
    expect(result.headers).toContain('#Data księgowania');
    expect(result.headers).toContain('#Opis operacji');
    expect(result.headers).toContain('#Tytuł');
    expect(result.headers).toContain('#Nadawca/Odbiorca');
    expect(result.headers).toContain('#Numer konta');
    expect(result.headers).toContain('#Kwota');
    expect(result.headers).toContain('#Saldo po operacji');
  });

  it('parses all 10 data rows', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));
    expect(result.rowCount).toBe(10);
  });

  it('maps salary row correctly (no overflow — all fields present)', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['#Data operacji']).toBe('15.06.2025');
    expect(row['#Data księgowania']).toBe('16.06.2025');
    expect(row['#Opis operacji']).toBe('PRZELEW PRZYCHODZĄCY');
    expect(row['#Tytuł']).toContain('WYNAGRODZENIE ZA CZERWIEC');
    expect(row['#Nadawca/Odbiorca']).toContain('DIGITAL SOLUTIONS');
    expect(row['#Numer konta']).toContain('1050 1025');
    expect(row['#Kwota']).toBe('8 500,00');
    expect(row['#Saldo po operacji']).toBe('12 340,67');
  });

  // FIXED: anchor-based strategy merges middle into first middle slot,
  // amounts always correctly at end (no shift)
  it('maps Żabka row correctly (empty Nadawca/Numer — extra semicolons)', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));
    const row = result.rows[1];

    expect(row).toBeDefined();
    expect(row['#Data operacji']).toBe('14.06.2025');
    expect(row['#Opis operacji']).toContain('ZAKUP PRZY UŻYCIU KARTY');
    expect(row['#Opis operacji']).toContain('ŻABKA');
    // Key: amounts are NOT shifted
    expect(row['#Kwota']).toBe('-14,80');
    expect(row['#Saldo po operacji']).toBe('3 840,67');
  });

  // FIXED: anchor-based strategy — middle merged, amounts at end
  it('maps Nova Development row correctly (semicolon inside Nadawca field)', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));
    const row = result.rows[2];

    expect(row).toBeDefined();
    expect(row['#Data operacji']).toBe('13.06.2025');
    expect(row['#Opis operacji']).toContain('PRZELEW WYCHODZĄCY');
    expect(row['#Opis operacji']).toContain('CZYNSZ LIPIEC');
    expect(row['#Opis operacji']).toContain('NOVA DEVELOPMENT');
    // Key: amounts are NOT shifted
    expect(row['#Kwota']).toBe('-2 100,00');
    expect(row['#Saldo po operacji']).toBe('3 855,47');
  });

  // FIXED: anchor-based strategy — BLIK content is in merged middle
  it('maps Allegro BLIK row correctly (multiple empty fields)', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));
    // With anchor strategy, #Opis contains merged middle — find by content
    const row = result.rows.find((r) =>
      (r['#Opis operacji'] ?? '').includes('BLIK'),
    );

    expect(row).toBeDefined();
    expect(row['#Opis operacji']).toContain('ALLEGRO');
    // Key: amounts are NOT shifted
    expect(row['#Kwota']).toBe('-239,99');
    expect(row['#Saldo po operacji']).toBe('6 119,47');
  });

  // This passes because the salary row (first) doesn't trigger overflow
  it('maps all rows with correct #Kwota values — salary only (others broken)', async () => {
    const result = await parseCsvFile(loadStubAsFile('02-medium-mbank.csv'));
    // Only salary row (index 0) has correct mapping — it has 9 tokens = no overflow
    expect(result.rows[0]['#Kwota']).toBe('8 500,00');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 03 — Hard: PKO BP (metadata header, quoted multiline fields, footer)
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 03-hard-pkobp.csv', () => {
  it('skips metadata and parses correct headers', async () => {
    const result = await parseCsvFile(loadStubAsFile('03-hard-pkobp.csv'));

    // papaparse strips quotes from headers
    expect(result.headers).toContain('Data waluty');
    expect(result.headers).toContain('Data operacji');
    expect(result.headers).toContain('Typ');
    expect(result.headers).toContain('Opis');
    expect(result.headers).toContain('Kwota');
    expect(result.headers).toContain('Waluta');
  });

  it('parses data rows (skipping metadata)', async () => {
    const result = await parseCsvFile(loadStubAsFile('03-hard-pkobp.csv'));
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('maps first transaction row with correct date', async () => {
    const result = await parseCsvFile(loadStubAsFile('03-hard-pkobp.csv'));
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Data waluty']).toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('maps amount field correctly for first row', async () => {
    const result = await parseCsvFile(loadStubAsFile('03-hard-pkobp.csv'));
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Kwota']).toMatch(/[+-]?\d/);
  });

  it('maps currency field correctly', async () => {
    const result = await parseCsvFile(loadStubAsFile('03-hard-pkobp.csv'));
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Waluta']).toBe('PLN');
  });

  // PKO BP has multiline quoted fields — verify they're parsed as one value
  it('handles multiline quoted Opis field', async () => {
    const result = await parseCsvFile(loadStubAsFile('03-hard-pkobp.csv'));
    const row = result.rows[0];

    expect(row).toBeDefined();
    // Opis should contain multiple lines joined (papaparse handles this)
    expect(row['Opis']).toBeDefined();
    expect(row['Opis'].length).toBeGreaterThan(10);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 04 — Mixed: Easy structure, hard data (various date/amount formats)
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 04-mixed-easy-structure-hard-data.csv', () => {
  it('parses correct headers', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('04-mixed-easy-structure-hard-data.csv'),
    );

    expect(result.headers).toEqual([
      'Date',
      'Type',
      'Title',
      'Amount',
      'Balance',
    ]);
  });

  it('parses all 10 data rows', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('04-mixed-easy-structure-hard-data.csv'),
    );
    expect(result.rowCount).toBe(10);
  });

  it('maps first row correctly (salary with comma-containing title)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('04-mixed-easy-structure-hard-data.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Date']).toBe('01/06/2025');
    expect(row['Type']).toBe('INCOME');
    expect(row['Title']).toContain('Wynagrodzenie');
    expect(row['Amount']).toBe('6 200.00');
    expect(row['Balance']).toBe('14 520.33');
  });

  it('maps parentheses-negative amounts correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('04-mixed-easy-structure-hard-data.csv'),
    );
    const row = result.rows[1];

    expect(row).toBeDefined();
    expect(row['Amount']).toBe('(8.50)');
  });

  it('maps all rows with no column shift', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('04-mixed-easy-structure-hard-data.csv'),
    );

    for (const row of result.rows) {
      // Type should be a known type keyword (includes P2P with digits)
      expect(row['Type']).toMatch(/^[A-Z0-9]+$/);
      // Balance should look numeric (digits, dots, commas, spaces, parens)
      expect(row['Balance']).toMatch(/[\d.,() ]+/);
    }
  });

  it('handles various date formats without column misalignment', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('04-mixed-easy-structure-hard-data.csv'),
    );

    // All Date values should be parseable date strings (various formats)
    for (const row of result.rows) {
      expect(row['Date']).toMatch(/\d/);
      // Type should NOT contain a date (would indicate shift)
      expect(row['Type']).not.toMatch(/\d{4}/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 05 — Mixed: Santander (pipe separator, metadata, footer)
//
// KNOWN BUG: footer (=== PODSUMOWANIE ===) is NOT stripped from data.
// The boundary detector finds data start but does NOT detect/remove footer.
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 05-mixed-hard-structure-mixed-data.csv', () => {
  it('parses correct headers (pipe-separated)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('05-mixed-hard-structure-mixed-data.csv'),
    );

    expect(result.headers).toContain('DATA WALUTY');
    expect(result.headers).toContain('DATA KSIĘGOWANIA');
    expect(result.headers).toContain('TYP OPERACJI');
    expect(result.headers).toContain('SZCZEGÓŁY');
    expect(result.headers).toContain('KWOTA (PLN)');
    expect(result.headers).toContain('SALDO');
    expect(result.headers).toContain('REF');
  });

  it('skips metadata (Santander header block)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('05-mixed-hard-structure-mixed-data.csv'),
    );

    const firstRow = result.rows[0];
    expect(firstRow).toBeDefined();
    // First row should be real data, not metadata
    expect(firstRow['DATA WALUTY']).toMatch(/\d{2}\.\d{2}\.\d{4}/);
  });

  // BUG: footer is included in parsed data
  it.fails(
    'excludes footer from parsed data (PODSUMOWANIE section)',
    async () => {
      const result = await parseCsvFile(
        loadStubAsFile('05-mixed-hard-structure-mixed-data.csv'),
      );

      for (const row of result.rows) {
        const values = Object.values(row);
        expect(values.some((v) => v.includes('PODSUMOWANIE'))).toBe(false);
      }
    },
  );

  it('maps first transaction row correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('05-mixed-hard-structure-mixed-data.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['DATA WALUTY']).toBe('01.06.2025');
    expect(row['KWOTA (PLN)']).toBe('+8 750,00');
    expect(row['SALDO']).toBe('22 140,55');
  });

  it.fails('maps first 3 data rows with correct column alignment', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('05-mixed-hard-structure-mixed-data.csv'),
    );

    // Check first 3 rows (simple data, before multiline quoted fields cause overflow)
    const dataRows = result.rows.slice(0, 3);
    for (const row of dataRows) {
      // DATA WALUTY should contain a date (DD.MM.YYYY or DD-MMM-YYYY)
      expect(row['DATA WALUTY']).toMatch(/\d{2}[.-]/);
      // KWOTA should contain a number with sign
      expect(row['KWOTA (PLN)']).toMatch(/[+-]?\d/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 08 — Deceptive Simple (looks easy, EUR, clean CSV)
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 08-exotic-deceptive-simple.csv', () => {
  it('parses correct headers', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('08-exotic-deceptive-simple.csv'),
    );

    expect(result.headers).toEqual([
      'Date',
      'Description',
      'Amount',
      'Balance',
      'Currency',
    ]);
  });

  it('parses data rows', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('08-exotic-deceptive-simple.csv'),
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('maps first row correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('08-exotic-deceptive-simple.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Date']).toBe('2025-06-01');
    expect(row['Description']).toBe('Salary from TechCorp Ltd');
    expect(row['Amount']).toBe('8500.00');
    expect(row['Balance']).toBe('12340.67');
    expect(row['Currency']).toBe('EUR');
  });

  // BUG: CRLF line endings cause trailing \r in last column values
  it.fails('maps all rows without column shift (CRLF issue)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('08-exotic-deceptive-simple.csv'),
    );

    for (const row of result.rows) {
      expect(row['Currency']).toBe('EUR');
      expect(row['Date']).toMatch(/\d{4}-\d{2}-\d{2}/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════
// 11 — Overflow: Indian SBI (semicolon, overflow in Description)
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 11-overflow-indian-sbi.csv', () => {
  it('parses headers', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('11-overflow-indian-sbi.csv'),
    );

    expect(result.headers).toContain('Txn Date');
    expect(result.headers).toContain('Description');
    expect(result.headers).toContain('Balance (₹)');
  });

  it('parses data rows', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('11-overflow-indian-sbi.csv'),
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('maps first row date correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('11-overflow-indian-sbi.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Txn Date']).toBe('01/06/2025');
  });

  it('maps balance correctly for first row (Indian format)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('11-overflow-indian-sbi.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    // Indian number format: 23,47,892.14
    expect(row['Balance (₹)']).toMatch(/[\d,]+\.\d{2}/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 13 — Overflow: Nigerian GTB (comma, overflow in Description)
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 13-overflow-nigerian-gtb.csv', () => {
  it('parses headers', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('13-overflow-nigerian-gtb.csv'),
    );

    expect(result.headers).toContain('Trans Date');
    expect(result.headers).toContain('Description');
    expect(result.headers).toContain('Balance');
  });

  it('parses data rows', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('13-overflow-nigerian-gtb.csv'),
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  it('maps first row date correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('13-overflow-nigerian-gtb.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Trans Date']).toBe('01/06/2025');
  });

  it('maps balance for first row (salary credit)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('13-overflow-nigerian-gtb.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Balance']).toMatch(/\d+/);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 14 — Overflow: Vietnamese VCB (pipe separator, overflow in Title)
//
// KNOWN BUG: boundary detector does NOT find header row —
// Vietnamese headers have no matching keywords in HEADER_KEYWORDS.
// Parser falls into headerless mode using first data row as headers.
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 14-overflow-vietnamese-vcb.csv', () => {
  // BUG: Vietnamese keywords not recognized → header detection fails
  it.fails('parses headers (Vietnamese keywords not in detector)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('14-overflow-vietnamese-vcb.csv'),
    );

    expect(result.headers).toContain('Ngay GD');
    expect(result.headers).toContain('Title');
    expect(result.headers).toContain('So du');
  });

  it('parses data rows', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('14-overflow-vietnamese-vcb.csv'),
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  // BUG: depends on correct header detection
  it.fails('maps first row date correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('14-overflow-vietnamese-vcb.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Ngay GD']).toBe('01/06/2025');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 15 — Overflow: Turkish Ziraat (semicolon, overflow in Description)
//
// KNOWN BUG: boundary detector does NOT find header row —
// Turkish keywords (İşlem Tarihi, Açıklama, Bakiye) are not in
// HEADER_KEYWORDS. Parser uses first data row as headers.
// ═══════════════════════════════════════════════════════════════════

describe('parseCsvFile e2e: 15-overflow-turkish-ziraat.csv', () => {
  // BUG: Turkish keywords not recognized → header detection fails
  it.fails('parses headers (Turkish keywords not in detector)', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('15-overflow-turkish-ziraat.csv'),
    );

    expect(result.headers).toContain('İşlem Tarihi');
    expect(result.headers).toContain('Açıklama/Description');
    expect(result.headers).toContain('Bakiye');
  });

  it('parses data rows', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('15-overflow-turkish-ziraat.csv'),
    );
    expect(result.rowCount).toBeGreaterThan(0);
  });

  // BUG: depends on correct header detection
  it.fails('maps first row date correctly', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('15-overflow-turkish-ziraat.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['İşlem Tarihi']).toBe('01.06.2025');
  });

  // BUG: depends on correct header detection
  it.fails('maps balance for first row', async () => {
    const result = await parseCsvFile(
      loadStubAsFile('15-overflow-turkish-ziraat.csv'),
    );
    const row = result.rows[0];

    expect(row).toBeDefined();
    expect(row['Bakiye']).toMatch(/[\d.,]+/);
  });
});
