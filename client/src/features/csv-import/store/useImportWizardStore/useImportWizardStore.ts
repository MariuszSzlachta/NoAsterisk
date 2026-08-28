import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type {
  AnonymizationEntry,
  ColumnMapping,
  DomainField,
  ParsedCsvData,
  TransactionRow,
  WizardStep,
} from '#features/csv-import/model/types';

// ─── Batch Edit Panel ────────────────────────────────────────────

interface PendingBatchEdit {
  readonly editedRowId: string;
  readonly field: 'title' | 'category';
  readonly originalValue: string;
  readonly newValue: string;
  readonly similarRowIds: ReadonlyArray<string>;
}

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
  readonly batchId: string | undefined;

  // UI state
  readonly selectedRowIds: ReadonlyArray<string>;

  // Batch edit panel
  readonly batchEditPanel: {
    readonly isOpen: boolean;
    readonly pendingEdit: PendingBatchEdit | undefined;
  };

  // Actions
  readonly setStep: (step: WizardStep) => void;
  readonly nextStep: () => void;
  readonly prevStep: () => void;

  readonly setFile: (file: File) => void;
  readonly setParsedData: (data: ParsedCsvData) => void;
  readonly setParseError: (error: string) => void;

  readonly setDetectedMapping: (mapping: ColumnMapping) => void;
  readonly updateColumnMapping: (
    column: string,
    field: DomainField | undefined,
  ) => void;
  readonly confirmMapping: (mapping: ColumnMapping) => void;

  readonly setRows: (rows: ReadonlyArray<TransactionRow>) => void;
  readonly updateRow: (
    id: string,
    updates: Partial<Pick<TransactionRow, 'title' | 'category'>>,
  ) => void;
  readonly setAnonymizationEntries: (
    entries: ReadonlyArray<AnonymizationEntry>,
  ) => void;

  readonly setSelectedRowIds: (ids: ReadonlyArray<string>) => void;
  readonly setSubmitting: (submitting: boolean) => void;
  readonly setSubmitError: (error: string | undefined) => void;

  // Batch edit actions
  readonly openBatchEditPanel: (pendingEdit: PendingBatchEdit) => void;
  readonly closeBatchEditPanel: () => void;
  readonly applyBatchEdit: () => void;

  readonly reset: () => void;
}

// ─── Initial State ───────────────────────────────────────────────

export const INITIAL_STATE: Omit<
  ImportWizardState,
  | 'setStep'
  | 'nextStep'
  | 'prevStep'
  | 'setFile'
  | 'setParsedData'
  | 'setParseError'
  | 'setDetectedMapping'
  | 'updateColumnMapping'
  | 'confirmMapping'
  | 'setRows'
  | 'updateRow'
  | 'setAnonymizationEntries'
  | 'setSelectedRowIds'
  | 'setSubmitting'
  | 'setSubmitError'
  | 'openBatchEditPanel'
  | 'closeBatchEditPanel'
  | 'applyBatchEdit'
  | 'reset'
> = {
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
  batchId: undefined,
  selectedRowIds: [],
  batchEditPanel: {
    isOpen: false,
    pendingEdit: undefined,
  },
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
    setFile: (file) =>
      set({
        file,
        parseError: undefined,
        parsedData: undefined,
        rows: [],
        anonymizationEntries: [],
        columnMapping: {},
        detectedMapping: {},
        batchId: undefined,
        isSubmitting: false,
        submitError: undefined,
        selectedRowIds: [],
        batchEditPanel: { isOpen: false, pendingEdit: undefined },
      }),
    setParsedData: (data) =>
      set({
        parsedData: data,
        parseError: undefined,
        rows: [],
        anonymizationEntries: [],
      }),
    setParseError: (error) => set({ parseError: error, parsedData: undefined }),

    // Step 1: Column Mapping
    setDetectedMapping: (mapping) =>
      set({ detectedMapping: mapping, columnMapping: mapping }),
    updateColumnMapping: (column, field) =>
      set((state) => {
        if (field === undefined) {
          delete (
            state.columnMapping as Record<string, DomainField | undefined>
          )[column];
        } else {
          (state.columnMapping as Record<string, DomainField | undefined>)[
            column
          ] = field;
        }
      }),
    confirmMapping: (mapping) => set({ columnMapping: mapping }),

    // Step 2: Preview — rows and entries are a relational pair
    setRows: (rows) => set({ rows }),
    updateRow: (id, updates) =>
      set((state) => {
        const rows = state.rows as TransactionRow[];
        const idx = rows.findIndex((r) => r.id === id);
        if (idx !== -1) {
          rows[idx] = { ...rows[idx], ...updates };
          // SECURITY: title change invalidates anonymization entry at this index.
          // Caller (anonymization step hook) MUST re-run detection after updating.
          if (updates.title !== undefined && import.meta.env.DEV) {
            console.warn(
              '[ImportWizardStore] Row title changed — anonymization entry at index may be stale',
            );
          }
        }
      }),
    setAnonymizationEntries: (entries) => {
      // Validate row-entry index alignment
      const currentRows = useImportWizardStore.getState().rows;
      if (
        entries.length > 0 &&
        currentRows.length > 0 &&
        entries.length !== currentRows.length
      ) {
        if (import.meta.env.DEV) {
          console.error(
            `[ImportWizardStore] entries.length (${entries.length}) !== rows.length (${currentRows.length})`,
          );
        }
      }
      set({ anonymizationEntries: entries });
    },

    // UI
    setSelectedRowIds: (ids) => set({ selectedRowIds: ids }),
    setSubmitting: (submitting) => set({ isSubmitting: submitting }),
    setSubmitError: (error) => set({ submitError: error }),

    // Batch edit panel
    openBatchEditPanel: (pendingEdit) =>
      set({ batchEditPanel: { isOpen: true, pendingEdit } }),
    closeBatchEditPanel: () =>
      set({ batchEditPanel: { isOpen: false, pendingEdit: undefined } }),
    applyBatchEdit: () =>
      set((state) => {
        const pending = state.batchEditPanel.pendingEdit;
        if (!pending) {
          return;
        }
        // SECURITY: Batch title edits require re-anonymization by the calling hook.
        if (pending.field === 'title' && import.meta.env.DEV) {
          console.warn(
            '[ImportWizardStore] Batch title edit applied — caller MUST re-run anonymization on affected rows',
          );
        }
        const rows = state.rows as TransactionRow[];
        for (const rowId of pending.similarRowIds) {
          const idx = rows.findIndex((r) => r.id === rowId);
          if (idx !== -1) {
            rows[idx] = { ...rows[idx], [pending.field]: pending.newValue };
          }
        }
        state.batchEditPanel = { isOpen: false, pendingEdit: undefined };
      }),

    // Reset — clears all state including raw PII from memory
    reset: () => set(INITIAL_STATE),
  })),
);
