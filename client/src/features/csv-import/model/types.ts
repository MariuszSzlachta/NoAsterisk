// ═══════════════════════════════════════════════════════════════════
// CSV Import — Domain Types (DEC-061: Enterprise CSV Engine)
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

// ─── Parser ──────────────────────────────────────────────────────

export type DateFormat =
  | 'DD.MM.YYYY'
  | 'YYYY-MM-DD'
  | 'DD/MM/YYYY'
  | 'DD-MM-YYYY';
export type AmountLocale = 'pl' | 'en';

export interface ParserConfig {
  readonly encoding: string;
  readonly separator: string;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
  readonly skipRows: number;
}

// ─── Column Mapping ──────────────────────────────────────────────

export type DomainField = 'date' | 'title' | 'amount' | 'currency' | 'balance';

export type ColumnMapping = Partial<Record<string, DomainField>>;

export interface MappingProfile {
  readonly id: string;
  readonly name: string;
  readonly mapping: ColumnMapping;
  readonly bankProfileId?: string;
  readonly createdAt: string;
}

// ─── Bank Profiles ───────────────────────────────────────────────

export interface BankProfile {
  readonly id: string;
  readonly bankName: string;
  readonly headerSignatures: readonly (readonly string[])[];
  readonly defaultMapping: ColumnMapping;
  readonly dateFormat: DateFormat;
  readonly amountLocale: AmountLocale;
  readonly encoding?: string;
  readonly separator?: string;
  readonly skipRows?: number;
}

// ─── Anonymizer: Detection ───────────────────────────────────────

export type PiiType = 'iban' | 'phone' | 'email' | 'name' | 'address' | 'card';

export interface DetectionSpan {
  readonly start: number;
  readonly end: number;
  readonly type: PiiType;
  readonly confidence: number;
  readonly original: string;
  readonly detectorId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface PiiDetector {
  readonly id: string;
  readonly priority: number;
  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[];
}

// ─── Anonymizer: Dictionaries ────────────────────────────────────

export type DictionaryType =
  | 'names_pl'
  | 'names_en'
  | 'surnames_pl'
  | 'merchants'
  | 'cities_pl'
  | 'phrases';

export interface DictionarySet {
  readonly firstNames: ReadonlySet<string>;
  readonly surnames: ReadonlySet<string>;
  readonly merchants: ReadonlySet<string>;
  readonly cities: ReadonlySet<string>;
  readonly phrases: ReadonlySet<string>;
}

export interface DictionaryProvider {
  loadAll(): Promise<DictionarySet>;
  isLoaded(): boolean;
}

// ─── Anonymizer: Pipeline Output ─────────────────────────────────

export type AnonymizationStatus = 'safe' | 'needs_review' | 'anonymized';

export interface AnonymizationEntry {
  readonly rowIndex: number;
  readonly originalTitle: string;
  readonly anonymizedTitle: string;
  readonly spans: readonly DetectionSpan[];
  readonly status: AnonymizationStatus;
  readonly accepted: boolean;
}

// ─── Transaction Row (mapped + processed) ────────────────────────

export type RowStatus = 'ok' | 'duplicate' | 'warning' | 'error';

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

// ─── Wizard State ────────────────────────────────────────────────

export type WizardStep = 0 | 1 | 2 | 3 | 4;

export interface ImportStats {
  readonly totalRows: number;
  readonly newTransactions: number;
  readonly duplicatesSkipped: number;
  readonly errorsSkipped: number;
  readonly dateRange: { readonly from: string; readonly to: string };
  readonly detectedBank?: string;
}

// ─── User Corrections (feedback loop) ────────────────────────────

export interface UserCorrection {
  readonly text: string;
  readonly action: 'accept' | 'reject';
  readonly detectorId: string;
  readonly timestamp: string;
}
