// ═══════════════════════════════════════════════════════════════════
// Transformation Types — Transaction Rows, Wizard State
// ═══════════════════════════════════════════════════════════════════

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
  readonly source?: string;
  readonly recipient?: string;
  readonly counterpart?: string;
  readonly reference?: string;
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
