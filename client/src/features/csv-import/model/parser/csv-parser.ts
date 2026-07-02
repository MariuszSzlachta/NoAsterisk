import { parseCsv } from '#shared/adapters/csv';

import type { CsvRow, ParsedCsvData } from '../types';
import { detectDataBoundaries } from './data-boundary-detector';
import { decodeBuffer, detectEncoding } from './encoding-detector';
import { detectSeparator } from './separator-detector';
import { resolveStrategy } from './strategies';

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
 * Generate positional column names for headerless CSVs.
 * Uses values from the first data row as column identifiers.
 */
const generatePositionalHeaders = (firstRow: readonly string[]): readonly string[] =>
  firstRow.map((value, i) => value.trim() || `Column ${i + 1}`);

/**
 * Full CSV parsing pipeline:
 * 1. Validate file
 * 2. Read as ArrayBuffer
 * 3. Detect encoding → decode → strip BOM
 * 4. Detect data boundaries (3-phase: find data by date, walk back for header)
 * 5. Detect separator on data portion
 * 6. Parse with papaparse (header: false)
 * 7. Resolve reassembly strategy + assemble rows
 * 8. Return structured result
 */
export const parseCsvFile = async (file: File): Promise<ParsedCsvData> => {
  validateFile(file);

  const buffer = await file.arrayBuffer();
  const encoding = detectEncoding(buffer);
  const rawText = normalizeNbsp(stripBom(decodeBuffer(buffer, encoding)));

  // First pass: detect separator on the full text (needed for boundary detection)
  const separator = detectSeparator(rawText);

  // 3-phase boundary detection
  const boundaries = detectDataBoundaries(rawText, separator);
  const dataText = boundaries.dataText;

  // Re-detect separator on data portion only (metadata lines might have skewed it)
  const dataSeparator = detectSeparator(dataText);

  if (import.meta.env.DEV) {
    const allLines = rawText.split('\n');
    console.info('[csv-parser] Boundary', {
      totalLines: allLines.length,
      headerRow: boundaries.headerRow,
      dataStartRow: boundaries.dataStartRow,
      skipRows: boundaries.skipRows,
      dataSeparator,
    });
  }

  // Parse raw data (no header mode — we handle headers ourselves)
  const result = parseCsv<string[]>(dataText, {
    header: false,
    delimiter: dataSeparator,
    skipEmptyLines: true,
  });

  if (result.data.length === 0) {
    throw new CsvParseError('CSV contains no data rows', 'NO_DATA');
  }

  // Determine headers and data rows based on boundary detection
  let headers: readonly string[];
  let dataRows: readonly (readonly string[])[];

  if (boundaries.headerRow !== null) {
    // Header found — first parsed row is the header, rest is data
    const [headerTokens, ...rest] = result.data;
    if (!headerTokens || headerTokens.length === 0) {
      throw new CsvParseError('No headers detected in CSV', 'NO_HEADERS');
    }
    headers = headerTokens;
    dataRows = rest;
  } else {
    // No header (Santander-style) — use first row values as positional identifiers
    // All parsed rows are data
    const firstRow = result.data[0];
    if (!firstRow || firstRow.length === 0) {
      throw new CsvParseError('No data detected in CSV', 'NO_DATA');
    }
    headers = generatePositionalHeaders(firstRow);
    dataRows = result.data;
  }

  // Resolve reassembly strategy based on headers + data sampling
  const { strategy, config } = resolveStrategy(headers, dataRows, dataSeparator);

  if (import.meta.env.DEV) {
    console.info('[csv-parser] Parse', {
      headerCount: headers.length,
      dataRows: dataRows.length,
      errors: result.errors.length,
      strategy: strategy.type,
      hasKeywordHeader: boundaries.headerRow !== null,
    });
  }

  // Reassemble rows using selected strategy, then map to Record<string, string>
  const rows: CsvRow[] = dataRows.map((rawTokens) => {
    const assembled = strategy.reassemble(rawTokens, config);
    const record: Record<string, string> = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = assembled[i] ?? '';
    }
    return record;
  });

  if (rows.length === 0) {
    throw new CsvParseError('CSV contains no data rows', 'NO_DATA');
  }

  return {
    headers: [...headers],
    rows,
    fileName: file.name,
    encoding,
    separator: dataSeparator,
    rowCount: rows.length,
  };
};
