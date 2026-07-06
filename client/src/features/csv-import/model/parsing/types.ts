// ═══════════════════════════════════════════════════════════════════
// Parsing Types — Raw CSV, Parser Config, Row Reassembly
// ═══════════════════════════════════════════════════════════════════

// ─── Raw CSV ─────────────────────────────────────────────────────

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

// ─── Parser Config ───────────────────────────────────────────────

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

// ─── Row Reassembly (Strategy Pattern) ───────────────────────────

export type ReassemblyStrategyType = 'direct' | 'overflow-merge';

export interface ReassemblyConfig {
  /** Number of columns in the header row */
  readonly expectedColumnCount: number;
  /** Separator used in the CSV (needed to rejoin overflow tokens) */
  readonly separator: string;
  /** Index of the column that absorbs overflow tokens (e.g. 1 for mBank #Opis operacji) */
  readonly overflowColumnIndex?: number;
  /** Number of fixed columns AFTER the overflow column (counted from end) */
  readonly fixedTailColumns?: number;
}

export interface ReassemblyStrategy {
  readonly type: ReassemblyStrategyType;
  reassemble(rawTokens: readonly string[], config: ReassemblyConfig): readonly string[];
}
