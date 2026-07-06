import { parseCsv } from '#shared/adapters/csv';

import type { CsvRow, ParsedCsvData } from '../types';
import { detectDataBoundaries } from '../data-boundary-detector/data-boundary.detector';
import { decodeBuffer, detectEncoding } from '../encoding-detector/encoding.detector';
import { detectSeparator } from '../separator-detector/separator.detector';
import { resolveStrategy } from '../strategies';

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
 * Normalize CRLF and standalone CR line endings to LF.
 * Windows-origin CSVs (e.g. 08-exotic-deceptive-simple) have \r\n endings
 * which leave trailing \r in last field after split.
 */
const normalizeCrlf = (text: string): string =>
  text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

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

interface TrailingNormalized {
  readonly headers: readonly string[];
  readonly dataRows: readonly (readonly string[])[];
}

/**
 * Strip consistent trailing empty tokens from headers and all data rows.
 *
 * Many banks (mBank, others) end every line with the separator character,
 * which produces a trailing empty string token after split. This inflates
 * the token count and confuses overflow detection.
 *
 * Algorithm:
 * 1. Count trailing empty tokens in header row
 * 2. Verify ≥80% of data rows also have at least that many trailing empties
 * 3. If consistent → strip from header + all rows
 *
 * This is safe because:
 * - Real data columns are never consistently empty across ALL rows
 * - Trailing separator is a format artifact, not data
 */
const normalizeTrailingSeparator = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
): TrailingNormalized => {
  // Count trailing empty tokens in header
  let headerTrailingCount = 0;
  for (let i = headers.length - 1; i >= 0; i--) {
    if (headers[i] === '') {
      headerTrailingCount++;
    } else {
      break;
    }
  }

  if (headerTrailingCount === 0) {
    return { headers, dataRows };
  }

  // Verify consistency: ≥80% of data rows must have at least as many trailing empties
  const sampleSize = Math.min(dataRows.length, 20);
  let matchingRows = 0;

  for (let r = 0; r < sampleSize; r++) {
    const row = dataRows[r];
    if (!row) {
      continue;
    }
    let rowTrailing = 0;
    for (let i = row.length - 1; i >= 0; i--) {
      if (row[i] === '') {
        rowTrailing++;
      } else {
        break;
      }
    }
    if (rowTrailing >= headerTrailingCount) {
      matchingRows++;
    }
  }

  const consistency = matchingRows / sampleSize;
  if (consistency < 0.8) {
    return { headers, dataRows };
  }

  // Strip trailing empties
  const strippedHeaders = headers.slice(0, headers.length - headerTrailingCount);
  const strippedRows = dataRows.map((row) => {
    // Strip same count from end, but only if they're actually empty
    let toStrip = 0;
    for (let i = row.length - 1; i >= 0 && toStrip < headerTrailingCount; i--) {
      if (row[i] === '') {
        toStrip++;
      } else {
        break;
      }
    }
    return toStrip > 0 ? row.slice(0, row.length - toStrip) : row;
  });

  return { headers: strippedHeaders, dataRows: strippedRows };
};

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
  const rawText = normalizeNbsp(normalizeCrlf(stripBom(decodeBuffer(buffer, encoding))));

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

  // ─── Trailing Separator Normalization ────────────────────────────
  // mBank and others end every line with separator (e.g. "data;opis;kwota;")
  // producing a trailing empty token. Strip consistent trailing empties from
  // header + all data rows so overflow detection isn't confused by them.
  const trailingNormalized = normalizeTrailingSeparator(headers, dataRows);
  headers = trailingNormalized.headers;
  dataRows = trailingNormalized.dataRows;

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
