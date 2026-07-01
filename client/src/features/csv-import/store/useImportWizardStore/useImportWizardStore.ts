import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type {
  AnonymizationEntry,
  ColumnMapping,
  CsvRow,
  DomainField,
  ParsedCsvData,
  TransactionRow,
  WizardStep,
} from '#features/csv-import/model/types';

// ─── State Interface ─────────────────────────────────────────────

interface ImportWizardState {
  // Wizard navigation
  readonly step: WizardStep;

  // Step 0: Upload
  readonly file: File | undefined;
  readonly parsedData: ParsedCsvData | undefined;
  readonly parseError: string | undefined;

  // Step 1: Column Mapping
  readonly columnMapping: ColumnMapping;
  readonly detectedMapping: ColumnMapping;

  // Step 2: Preview + Edit
  readonly rows: ReadonlyArray<TransactionRow>;
  readonly anonymizationEntries: ReadonlyArray<AnonymizationEntry>;

  // Step 3: Confirmation
  readonly isSubmitting: boolean;
  readonly submitError: string | undefined;

  // UI state
  readonly selectedRowIds: ReadonlyArray<string>;

  // Actions
  readonly setStep: (step: WizardStep) => void;
  readonly nextStep: () => void;
  readonly prevStep: () => void;

  readonly setFile: (file: File) => void;
  readonly setParsedData: (data: ParsedCsvData) => void;
  readonly setParseError: (error: string) => void;

  readonly setDetectedMapping: (mapping: ColumnMapping) => void;
  readonly updateColumnMapping: (column: string, field: DomainField | undefined) => void;
  readonly confirmMapping: (mapping: ColumnMapping) => void;

  readonly setRows: (rows: ReadonlyArray<TransactionRow>) => void;
  readonly updateRow: (id: string, updates: Partial<Pick<TransactionRow, 'title' | 'category'>>) => void;
  readonly setAnonymizationEntries: (entries: ReadonlyArray<AnonymizationEntry>) => void;

  readonly setSelectedRowIds: (ids: ReadonlyArray<string>) => void;
  readonly setSubmitting: (submitting: boolean) => void;
  readonly setSubmitError: (error: string | undefined) => void;

  readonly reset: () => void;
}

// ─── Initial State ───────────────────────────────────────────────

const INITIAL_STATE: Omit<ImportWizardState, 'setStep' | 'nextStep' | 'prevStep' | 'setFile' | 'setParsedData' | 'setParseError' | 'setDetectedMapping' | 'updateColumnMapping' | 'confirmMapping' | 'setRows' | 'updateRow' | 'setAnonymizationEntries' | 'setSelectedRowIds' | 'setSubmitting' | 'setSubmitError' | 'reset'> = {
  step: 0,
  file: undefined,
  parsedData: undefined,
  parseError: undefined,
  columnMapping: {},
  detectedMapping: {},
  rows: [],
  anonymizationEntries: [],
  isSubmitting: false,
  submitError: undefined,
  selectedRowIds: [],
};

// ─── Store ───────────────────────────────────────────────────────

export const useImportWizardStore = create<ImportWizardState>()(
  immer((set) => ({
    ...INITIAL_STATE,

    // Navigation
    setStep: (step) => set({ step }),
    nextStep: () =>
      set((state) => {
        if (state.step < 4) {
          state.step = (state.step + 1) as WizardStep;
        }
      }),
    prevStep: () =>
      set((state) => {
        if (state.step > 0) {
          state.step = (state.step - 1) as WizardStep;
        }
      }),

    // Step 0: Upload
    setFile: (file) => set({ file, parseError: undefined }),
    setParsedData: (data) => set({ parsedData: data, parseError: undefined }),
    setParseError: (error) => set({ parseError: error }),

    // Step 1: Column Mapping
    setDetectedMapping: (mapping) =>
      set({ detectedMapping: mapping, columnMapping: mapping }),
    updateColumnMapping: (column, field) =>
      set((state) => {
        if (field === undefined) {
          delete (state.columnMapping as Record<string, DomainField | undefined>)[column];
        } else {
          (state.columnMapping as Record<string, DomainField | undefined>)[column] = field;
        }
      }),
    confirmMapping: (mapping) => set({ columnMapping: mapping }),

    // Step 2: Preview
    setRows: (rows) => set({ rows }),
    updateRow: (id, updates) =>
      set((state) => {
        const rows = state.rows as TransactionRow[];
        const idx = rows.findIndex((r) => r.id === id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...updates };
        }
      }),
    setAnonymizationEntries: (entries) => set({ anonymizationEntries: entries }),

    // UI
    setSelectedRowIds: (ids) => set({ selectedRowIds: ids }),
    setSubmitting: (submitting) => set({ isSubmitting: submitting }),
    setSubmitError: (error) => set({ submitError: error }),

    // Reset
    reset: () => set(INITIAL_STATE),
  })),
);
