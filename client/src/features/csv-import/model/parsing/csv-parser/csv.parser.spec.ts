import { describe, expect, it } from 'vitest';

import { CsvParseError, parseCsvFile } from '.';

const createCsvFile = (content: string, name = 'test.csv'): File =>
  new File([content], name, { type: 'text/csv' });

describe('parseCsvFile (orchestrator)', () => {
  it('parses semicolon-separated CSV (PL bank format)', async () => {
    const csv =
      'Data operacji;Opis operacji;Kwota;Waluta\n2026-06-26;BIEDRONKA;-87,43;PLN\n2026-06-25;BOLT;-34,20;PLN\n';
    const result = await parseCsvFile(createCsvFile(csv));

    expect(result.headers).toEqual([
      'Data operacji',
      'Opis operacji',
      'Kwota',
      'Waluta',
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.separator).toBe(';');
    expect(result.encoding).toBe('utf-8');
    expect(result.rowCount).toBe(2);
    expect(result.fileName).toBe('test.csv');
  });

  it('parses comma-separated CSV (EN format)', async () => {
    const csv = 'Date,Description,Amount\n2026-06-26,UBER,-12.50\n';
    const result = await parseCsvFile(createCsvFile(csv));

    expect(result.separator).toBe(',');
    expect(result.rows[0]['Amount']).toBe('-12.50');
  });

  it('rejects non-.csv files', async () => {
    const file = new File(['data'], 'file.txt', { type: 'text/plain' });
    await expect(parseCsvFile(file)).rejects.toThrow(CsvParseError);
  });

  it('rejects empty files', async () => {
    const file = createCsvFile('');
    Object.defineProperty(file, 'size', { value: 0 });
    await expect(parseCsvFile(file)).rejects.toThrow('empty');
  });

  it('rejects oversized files', async () => {
    const file = createCsvFile('a');
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    await expect(parseCsvFile(file)).rejects.toThrow('10 MB');
  });

  it('handles quoted fields with separators inside', async () => {
    const csv = 'A;B;C\n"hello;world";foo;bar\n';
    const result = await parseCsvFile(createCsvFile(csv));

    expect(result.rows[0]['A']).toBe('hello;world');
  });
});
