import Papa from 'papaparse';

export interface CsvParseOptions {
  readonly delimiter: string;
  readonly header: boolean;
  readonly skipEmptyLines: boolean;
}

export interface CsvParseResult<TRow> {
  readonly data: TRow[];
  readonly meta: { readonly fields?: string[] };
  readonly errors: ReadonlyArray<{
    readonly type: string;
    readonly row?: number;
  }>;
}

/**
 * Port interface — CSV parsing adapter.
 * Current implementation: papaparse. Swappable without touching features.
 */
export const parseCsv = <TRow extends Record<string, string>>(
  text: string,
  options: CsvParseOptions,
): CsvParseResult<TRow> => {
  const result = Papa.parse<TRow>(text, {
    header: options.header,
    delimiter: options.delimiter,
    skipEmptyLines: options.skipEmptyLines,
  });

  return {
    data: result.data,
    meta: { fields: result.meta.fields },
    errors: result.errors.map((e) => ({ type: e.type, row: e.row })),
  };
};
