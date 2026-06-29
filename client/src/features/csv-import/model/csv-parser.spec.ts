import { describe, expect, it } from 'vitest';

import { CsvParseError, parseCsvFile } from './csv-parser';

const createCsvFile = (content: string, name = 'test.csv'): File =>
  new File([content], name, { type: 'text/csv' });

describe('parseCsvFile', () => {
  it('parses valid CSV with headers', async () => {
    const csv = 'Data operacji,Opis,Kwota\n2026-06-26,BIEDRONKA,-87.43\n2026-06-25,BOLT,-34.20';
    const result = await parseCsvFile(createCsvFile(csv));

    expect(result.headers).toEqual(['Data operacji', 'Opis', 'Kwota']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]['Data operacji']).toBe('2026-06-26');
    expect(result.rows[0]['Kwota']).toBe('-87.43');
    expect(result.fileName).toBe('test.csv');
  });

  it('rejects non-.csv files', async () => {
    const file = new File(['data'], 'file.txt', { type: 'text/plain' });

    await expect(parseCsvFile(file)).rejects.toThrow(CsvParseError);
    await expect(parseCsvFile(file)).rejects.toThrow('Dozwolone tylko pliki .csv');
  });

  it('rejects empty files', async () => {
    const file = createCsvFile('');
    Object.defineProperty(file, 'size', { value: 0 });

    await expect(parseCsvFile(file)).rejects.toThrow('Plik jest pusty');
  });

  it('rejects files exceeding max size', async () => {
    const file = createCsvFile('a');
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    await expect(parseCsvFile(file)).rejects.toThrow('przekracza');
  });

  it('skips empty lines', async () => {
    const csv = 'Col1,Col2\nA,B\n\nC,D\n';
    const result = await parseCsvFile(createCsvFile(csv));

    expect(result.rows).toHaveLength(2);
  });

  it('rejects file with no headers', async () => {
    const csv = '\n\n\n';
    const file = createCsvFile(csv);

    await expect(parseCsvFile(file)).rejects.toThrow(CsvParseError);
  });
});
