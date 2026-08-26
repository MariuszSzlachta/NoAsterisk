// ═══════════════════════════════════════════════════════════════════
// Anonymization Types — PII Detection, Dictionaries, Pipeline
// ═══════════════════════════════════════════════════════════════════

// ─── Detection ───────────────────────────────────────────────────

export type PiiType = 'iban' | 'phone' | 'email' | 'name' | 'address' | 'card' | 'pesel' | 'nip' | 'national_id' | 'birth_date';

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

// ─── Dictionaries ────────────────────────────────────────────────

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
  /** Whether the loaded dictionaries are from API (full) or local stubs (reduced coverage). */
  isStubFallback(): boolean;
}

// ─── Pipeline Output ─────────────────────────────────────────────

export type AnonymizationStatus = 'safe' | 'needs_review' | 'anonymized';

export interface AnonymizationEntry {
  readonly rowIndex: number;
  readonly originalTitle: string;
  readonly anonymizedTitle: string;
  readonly spans: readonly DetectionSpan[];
  readonly status: AnonymizationStatus;
  readonly accepted: boolean;
}

/**
 * Safe entry for persistence/submission — originalTitle stripped.
 * Use `toSubmitEntry()` from pipeline to create.
 */
export interface AnonymizationSubmitEntry {
  readonly rowIndex: number;
  readonly anonymizedTitle: string;
  readonly status: AnonymizationStatus;
  readonly accepted: boolean;
}
