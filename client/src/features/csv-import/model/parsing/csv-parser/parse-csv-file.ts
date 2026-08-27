import { detectDataBoundaries } from '#features/csv-import/model/parsing/data-boundary-detector';
import {
  decodeBuffer,
  detectEncoding,
} from '#features/csv-import/model/parsing/encoding-detector';
import { detectSeparator } from '#features/csv-import/model/parsing/separator-detector';
import {
  normalizeCrlf,
  normalizeNbsp,
  stripBom,
} from '#features/csv-import/model/parsing/shared';
import { resolveStrategy } from '#features/csv-import/model/parsing/strategies';
import type {
  CsvRow,
  ParsedCsvData,
} from '#features/csv-import/model/parsing/types';
import { parseCsv } from '#shared/adapters/csv';

import { CsvParseError } from './helpers/csv-parse-error';
import { generatePositionalHeaders } from './helpers/generate-positional-headers';
import { normalizeTrailingSeparator } from './helpers/normalize-trailing-separator';
import { tokensToRow } from './helpers/tokens-to-row';
import { validateFile } from './helpers/validate-file';

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
