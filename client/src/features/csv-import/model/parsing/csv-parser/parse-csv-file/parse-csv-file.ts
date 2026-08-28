import { detectDataBoundaries } from '#features/csv-import/model/parsing/data-boundary-detector/detect-data-boundaries';
import { decodeBuffer } from '#features/csv-import/model/parsing/encoding-detector/decode-buffer';
import { detectEncoding } from '#features/csv-import/model/parsing/encoding-detector/detect-encoding';
import { detectSeparator } from '#features/csv-import/model/parsing/separator-detector/detect-separator';
import { normalizeCrlf } from '#features/csv-import/model/parsing/shared/text-normalizers/normalize-crlf';
import { normalizeNbsp } from '#features/csv-import/model/parsing/shared/text-normalizers/normalize-nbsp';
import { stripBom } from '#features/csv-import/model/parsing/shared/text-normalizers/strip-bom';
import { resolveStrategy } from '#features/csv-import/model/parsing/strategies/resolve-strategy';
import type { CsvRow } from '#features/csv-import/model/parsing/types/csv-row';
import type { ParsedCsvData } from '#features/csv-import/model/parsing/types/parsed-csv-data';
import { parseCsv } from '#shared/adapters/csv';

import { CsvParseError } from '#features/csv-import/model/parsing/csv-parser/helpers/csv-parse-error';
import { generatePositionalHeaders } from '#features/csv-import/model/parsing/csv-parser/helpers/generate-positional-headers';
import { normalizeTrailingSeparator } from '#features/csv-import/model/parsing/csv-parser/helpers/normalize-trailing-separator';
import { tokensToRow } from '#features/csv-import/model/parsing/csv-parser/helpers/tokens-to-row';
import { validateFile } from '#features/csv-import/model/parsing/csv-parser/helpers/validate-file';
import { ERROR_CODE_NO_DATA } from '#features/csv-import/model/parsing/csv-parser/parse-csv-file/constants/error-code-no-data';
import { ERROR_CODE_NO_HEADERS } from '#features/csv-import/model/parsing/csv-parser/parse-csv-file/constants/error-code-no-headers';

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
        throw new CsvParseError('CSV contains no data rows', ERROR_CODE_NO_DATA);
      }

      const { headers: rawHeaders, dataRows: rawDataRows } =
        boundaries.headerRow !== null
          ? (() => {
              const [headerTokens, ...rest] = result.data;
              if (!headerTokens || headerTokens.length === 0) {
                throw new CsvParseError(
                  'No headers detected in CSV',
                  ERROR_CODE_NO_HEADERS,
                );
              }
              return {
                headers: [...headerTokens],
                dataRows: rest.map((row) => [...row]),
              };
            })()
          : (() => {
              const firstRow = result.data[0];
              if (!firstRow || firstRow.length === 0) {
                throw new CsvParseError('No data detected in CSV', ERROR_CODE_NO_DATA);
              }
              return {
                headers: generatePositionalHeaders(firstRow),
                dataRows: result.data.map((row) => [...row]),
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
        throw new CsvParseError('CSV contains no data rows', ERROR_CODE_NO_DATA);
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
