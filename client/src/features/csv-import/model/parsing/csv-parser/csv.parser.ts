import { detectDataBoundaries } from '#features/csv-import/model/parsing/data-boundary-detector/data-boundary.detector';
import {
  decodeBuffer,
  detectEncoding,
} from '#features/csv-import/model/parsing/encoding-detector';
import { detectSeparator } from '#features/csv-import/model/parsing/separator-detector/separator.detector';
import {
  normalizeCrlf,
  normalizeNbsp,
  stripBom,
} from '#features/csv-import/model/parsing/shared/text-normalizers';
import { resolveStrategy } from '#features/csv-import/model/parsing/strategies';
import type {
  CsvRow,
  ParsedCsvData,
  TrailingNormalized,
} from '#features/csv-import/model/parsing/types';
import { parseCsv } from '#shared/adapters/csv';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const TRAILING_CONSISTENCY_THRESHOLD = 0.8;
const MAX_TRAILING_SAMPLE_SIZE = 20;

export class CsvParseError extends Error {
  readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'CsvParseError';
    this.code = code;
  }
}

export const validateFile = (file: File): void => {
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

export const generatePositionalHeaders = (
  firstRow: readonly string[],
): readonly string[] =>
  firstRow.map((value, i) => value.trim() || `Column ${i + 1}`);

export const countTrailingEmpties = (arr: readonly string[]): number =>
  [...arr].reverse().findIndex((s) => s !== '');

export const countTrailingEmptiesInRow = (arr: readonly string[]): number => {
  const idx = [...arr].reverse().findIndex((s) => s !== '');
  return idx === -1 ? arr.length : idx;
};

/**
 * Strip consistent trailing empty tokens caused by bank CSVs ending each line with separator.
 * Safe: real data columns are never consistently empty across ALL rows.
 */
export const normalizeTrailingSeparator = (
  headers: readonly string[],
  dataRows: readonly (readonly string[])[],
): TrailingNormalized => {
  const headerTrailingCount = countTrailingEmpties(headers);

  if (headerTrailingCount <= 0) {
    return { headers, dataRows };
  }

  const sample = dataRows.slice(0, MAX_TRAILING_SAMPLE_SIZE);
  const matchingCount = sample.filter(
    (row) => countTrailingEmptiesInRow(row) >= headerTrailingCount,
  ).length;

  const consistency = matchingCount / sample.length;
  if (consistency < TRAILING_CONSISTENCY_THRESHOLD) {
    return { headers, dataRows };
  }

  const strippedHeaders = headers.slice(
    0,
    headers.length - headerTrailingCount,
  );
  const strippedRows = dataRows.map((row) => {
    const toStrip = Math.min(
      countTrailingEmptiesInRow(row),
      headerTrailingCount,
    );
    return toStrip > 0 ? row.slice(0, row.length - toStrip) : row;
  });

  return { headers: strippedHeaders, dataRows: strippedRows };
};

export const tokensToRow = (
  headers: readonly string[],
  assembled: readonly string[],
): CsvRow => Object.fromEntries(headers.map((h, i) => [h, assembled[i] ?? '']));

/**
 * Full CSV parsing pipeline:
 * validate → read → detect encoding → decode → normalize →
 * detect boundaries → detect separator → parse → resolve strategy →
 * normalize trailing → reassemble rows
 */
export const parseCsvFile = (file: File): Promise<ParsedCsvData> =>
  Promise.resolve()
    .then(() => {
      validateFile(file);
      return file.arrayBuffer();
    })
    .then((buffer) => {
      const encoding = detectEncoding(buffer);
      const rawText = normalizeNbsp(
        normalizeCrlf(stripBom(decodeBuffer(buffer, encoding))),
      );

      const separator = detectSeparator(rawText);
      const boundaries = detectDataBoundaries(rawText, separator);
      const dataSeparator = detectSeparator(boundaries.dataText);

      const result = parseCsv<string[]>(boundaries.dataText, {
        header: false,
        delimiter: dataSeparator,
        skipEmptyLines: true,
      });

      if (result.data.length === 0) {
        throw new CsvParseError('CSV contains no data rows', 'NO_DATA');
      }

      const { headers: rawHeaders, dataRows: rawDataRows } =
        boundaries.headerRow !== null
          ? (() => {
              const [headerTokens, ...rest] = result.data;
              if (!headerTokens || headerTokens.length === 0) {
                throw new CsvParseError(
                  'No headers detected in CSV',
                  'NO_HEADERS',
                );
              }
              return {
                headers: headerTokens as readonly string[],
                dataRows: rest as readonly (readonly string[])[],
              };
            })()
          : (() => {
              const firstRow = result.data[0];
              if (!firstRow || firstRow.length === 0) {
                throw new CsvParseError('No data detected in CSV', 'NO_DATA');
              }
              return {
                headers: generatePositionalHeaders(firstRow),
                dataRows: result.data as readonly (readonly string[])[],
              };
            })();

      const { headers, dataRows } = normalizeTrailingSeparator(
        rawHeaders,
        rawDataRows,
      );
      const { strategy, config } = resolveStrategy(
        headers,
        dataRows,
        dataSeparator,
      );

      const rows: readonly CsvRow[] = dataRows.map((rawTokens) =>
        tokensToRow(headers, strategy.reassemble(rawTokens, config)),
      );

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
    });
