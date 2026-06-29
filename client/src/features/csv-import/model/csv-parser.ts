import Papa from 'papaparse';

import type { CsvRow, ParsedCsvData } from './types';

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export class CsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

const validateFile = (file: File): void => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new CsvParseError('Dozwolone tylko pliki .csv');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CsvParseError(`Plik przekracza ${MAX_FILE_SIZE_MB} MB`);
  }
  if (file.size === 0) {
    throw new CsvParseError('Plik jest pusty');
  }
};

export const parseCsvFile = (file: File): Promise<ParsedCsvData> => {
  try {
    validateFile(file);
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0 && result.data.length === 0) {
          reject(new CsvParseError('Nie udało się sparsować pliku CSV'));
          return;
        }
        const headers = result.meta.fields ?? [];
        if (headers.length === 0) {
          reject(new CsvParseError('Plik nie zawiera nagłówków'));
          return;
        }
        const rows: CsvRow[] = result.data;
        resolve({ headers, rows, fileName: file.name });
      },
      error: (err) => {
        reject(new CsvParseError(err.message));
      },
    });
  });
};
