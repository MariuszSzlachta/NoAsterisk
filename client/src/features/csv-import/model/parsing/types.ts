export interface CsvRow {
  readonly [columnName: string]: string;
}

export interface ParsedCsvData {
  readonly headers: readonly string[];
  readonly rows: readonly CsvRow[];
  readonly fileName: string;
  readonly encoding: string;
  readonly separator: string;
  readonly rowCount: number;
}

export type DateFormat =
  | 'DD.MM.YYYY'
  | 'YYYY-MM-DD'
  | 'DD/MM/YYYY'
  | 'DD-MM-YYYY'
  | 'YYYY/MM/DD'
  | 'DD.MM.YY'
  | 'DD/MM/YY'
  | 'DD-MMM-YYYY'
  | 'DD Mon YYYY';

export type AmountLocale = 'pl' | 'en';

export interface ParserConfig {
  readonly encoding: string;
  readonly separator: string;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
  readonly skipRows: number;
}

export type ReassemblyStrategyType = 'direct' | 'overflow-merge';

export interface ReassemblyConfig {
  readonly expectedColumnCount: number;
  readonly separator: string;
  /** Index of the column that absorbs overflow tokens (e.g. 1 for mBank #Opis operacji) */
  readonly overflowColumnIndex?: number;
  /** Number of fixed columns AFTER the overflow column (counted from end) */
  readonly fixedTailColumns?: number;
}

export interface ReassemblyStrategy {
  readonly type: ReassemblyStrategyType;
  reassemble(
    rawTokens: readonly string[],
    config: ReassemblyConfig,
  ): readonly string[];
}

export interface DataBoundaries {
  /** Index of the header row (null = no keyword header found, use positional) */
  readonly headerRow: number | null;
  readonly dataStartRow: number;
  /** Number of metadata lines before data (= dataStartRow or headerRow) */
  readonly skipRows: number;
  readonly dataText: string;
}

export interface ResolvedStrategy {
  readonly strategy: ReassemblyStrategy;
  readonly config: ReassemblyConfig;
}

export interface DecodeWarning {
  readonly replacementCharCount: number;
  readonly message: string;
}

export interface TrailingNormalized {
  readonly headers: readonly string[];
  readonly dataRows: readonly (readonly string[])[];
}

export interface MonthLocale {
  readonly id: string;
  readonly months: Readonly<Record<string, number>>;
}

export interface NumericFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly groups: {
    readonly year: number;
    readonly month: number;
    readonly day: number;
  };
  readonly yearResolver?: (s: string) => number | null;
}

export interface MonthNameFormatDef {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (
    match: RegExpMatchArray,
  ) => { year: number; month: number; day: number } | null;
}

export interface ParseableDateFormat {
  readonly format: DateFormat;
  readonly regex: RegExp;
  readonly parse: (
    m: RegExpMatchArray,
  ) => { year: number; month: number; day: number } | null;
}
