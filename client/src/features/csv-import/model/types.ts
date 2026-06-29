/** Raw row parsed from CSV file */
export interface CsvRow {
  readonly [columnName: string]: string;
}

/** Result of parsing a CSV file */
export interface ParsedCsvData {
  readonly headers: readonly string[];
  readonly rows: readonly CsvRow[];
  readonly fileName: string;
}

/** System domain fields that CSV columns map to */
export type DomainField = 'date' | 'title' | 'amount' | 'currency' | 'balance';

/** Mapping from CSV column name to domain field */
export type ColumnMapping = Partial<Record<string, DomainField>>;

/** Saved mapping profile for reuse */
export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  readonly mapping: ColumnMapping;
  readonly createdAt: string;
}

/** Status of PII detection per cell */
export type AnonymizationStatus = 'safe' | 'needs_review' | 'anonymized';

/** Single detected PII match */
export interface PiiMatch {
  readonly start: number;
  readonly end: number;
  readonly type: 'iban' | 'phone' | 'name';
  readonly original: string;
  readonly masked: string;
}

/** Anonymization entry for a single row */
export interface AnonymizationEntry {
  readonly rowIndex: number;
  readonly originalTitle: string;
  readonly anonymizedTitle: string;
  readonly matches: readonly PiiMatch[];
  readonly status: AnonymizationStatus;
  readonly accepted: boolean;
}

/** Status of a transaction row in preview step */
export type RowStatus = 'ok' | 'duplicate' | 'warning' | 'error';

/** Processed transaction row ready for preview */
export interface TransactionRow {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly amount: number;
  readonly currency: string;
  readonly balance?: number;
  readonly category?: string;
  readonly status: RowStatus;
  readonly statusReason?: string;
  readonly duplicateHash?: string;
}

/** Wizard step indices */
export type WizardStep = 0 | 1 | 2 | 3 | 4;

/** Import statistics for summary step */
export interface ImportStats {
  readonly totalRows: number;
  readonly newTransactions: number;
  readonly duplicatesSkipped: number;
  readonly errorsSkipped: number;
  readonly dateRange: { from: string; to: string };
  readonly detectedBank?: string;
}
