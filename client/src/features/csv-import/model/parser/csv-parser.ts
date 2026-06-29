import Papa from 'papaparse';

import type { CsvRow, ParsedCsvData } from '../types';

import { decodeBuffer, detectEncoding } from './encoding-detector';
import { detectSeparator } from './separator-detector';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export class CsvParseError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CsvParseError';
  }
}

const validateFile = (file: File): void => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new CsvParseError('Only .csv files are supported', 'INVALID_EXTENSION');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CsvParseError('File exceeds 10 MB limit', 'FILE_TOO_LARGE');
  }
  if (file.size === 0) {
    throw new CsvParseError('File is empty', 'EMPTY_FILE');
  }
};

/**
 * Full CSV parsing pipeline:
 * 1. Validate file
 * 2. Read as ArrayBuffer
 * 3. Detect encoding → decode
 * 4. Detect separator
 * 5. Parse with papaparse
 * 6. Return structured result
 */
export const parseCsvFile = async (file: File): Promise<ParsedCsvData> => {
  validateFile(file);

  const buffer = await file.arrayBuffer();
  const encoding = detectEncoding(buffer);
  const text = decodeBuffer(buffer, encoding);
  const separator = detectSeparator(text);

  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: separator,
    skipEmptyLines: true,
  });

  if (result.meta.fields === undefined || result.meta.fields.length === 0) {
    throw new CsvParseError('No headers detected in CSV', 'NO_HEADERS');
  }

  // Reject if >10% of rows have fatal parse errors
  if (result.errors.length > 0 && result.data.length > 0) {
    const errorRate = result.errors.length / result.data.length;
    if (errorRate > 0.1) {
      throw new CsvParseError(
        `CSV has ${result.errors.length} parse errors in ${result.data.length} rows`,
        'PARSE_ERRORS',
      );
    }
  }

  if (result.data.length === 0) {
    throw new CsvParseError('CSV contains no data rows', 'NO_DATA');
  }

  const rows: CsvRow[] = result.data;

  return {
    headers: result.meta.fields,
    rows,
    fileName: file.name,
    encoding,
    separator,
    rowCount: rows.length,
  };
};
