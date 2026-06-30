import { parseCsv } from '#shared/adapters/csv';

import type { CsvRow, ParsedCsvData } from '../types';
import { detectDataBoundaries } from './data-boundary-detector';
import { decodeBuffer, detectEncoding } from './encoding-detector';
import { detectSeparator } from './separator-detector';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export class CsvParseError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CsvParseError';
    this.code = code;
  }
}

const validateFile = (file: File): void => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new CsvParseError(
      'Only .csv files are supported',
      'INVALID_EXTENSION',
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CsvParseError('File exceeds 10 MB limit', 'FILE_TOO_LARGE');
  }
  if (file.size === 0) {
    throw new CsvParseError('File is empty', 'EMPTY_FILE');
  }
};

/**
 * Strip BOM character if present (UTF-8 BOM decoded as \uFEFF).
 */
const stripBom = (text: string): string =>
  text.startsWith('\uFEFF') ? text.slice(1) : text;

/**
 * Normalize non-breaking spaces to regular spaces.
 * NBSP (\u00A0) is used as thousands separator in Polish bank exports.
 */
const normalizeNbsp = (text: string): string =>
  text.replace(/\u00A0/g, ' ');

/**
 * Full CSV parsing pipeline:
 * 1. Validate file
 * 2. Read as ArrayBuffer
 * 3. Detect encoding → decode → strip BOM
 * 4. Detect data boundaries (skip metadata header + footer)
 * 5. Detect separator on data portion
 * 6. Parse with papaparse
 * 7. Return structured result
 */
export const parseCsvFile = async (file: File): Promise<ParsedCsvData> => {
  validateFile(file);

  const buffer = await file.arrayBuffer();
  const encoding = detectEncoding(buffer);
  const rawText = normalizeNbsp(stripBom(decodeBuffer(buffer, encoding)));

  // First pass: detect separator on the full text (needed for boundary detection)
  const separator = detectSeparator(rawText);

  // Detect where actual data begins/ends (skip metadata + footer)
  const boundaries = detectDataBoundaries(rawText, separator);
  const dataText = boundaries.dataText;

  // Re-detect separator on data portion only (metadata lines might have skewed it)
  const dataSeparator = detectSeparator(dataText);

  const result = parseCsv<Record<string, string>>(dataText, {
    header: true,
    delimiter: dataSeparator,
    skipEmptyLines: true,
  });

  if (result.meta.fields === undefined || result.meta.fields.length === 0) {
    throw new CsvParseError('No headers detected in CSV', 'NO_HEADERS');
  }

  // Reject if >10% of rows have parse errors
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
    separator: dataSeparator,
    rowCount: rows.length,
  };
};
