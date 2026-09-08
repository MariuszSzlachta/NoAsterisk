import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { PendingBatchEdit } from '#features/csv-import/store/useImportWizardStore/pending-batch-edit';
import type { ImportWizardData } from '#features/csv-import/store/useImportWizardStore/import-wizard-data';
import { INITIAL_STATE } from '#features/csv-import/store/useImportWizardStore/initial-state';
import { nextWizardStep } from '#features/csv-import/store/useImportWizardStore/next-wizard-step';
import { prevWizardStep } from '#features/csv-import/store/useImportWizardStore/prev-wizard-step';
import type {
  AnonymizationEntry,
  ColumnMapping,
  DomainField,
  ParsedCsvData,
  TransactionRow,
  WizardStep,
} from '#features/csv-import/model/types';

interface ImportWizardState extends ImportWizardData {
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

  readonly openBatchEditPanel: (pendingEdit: PendingBatchEdit) => void;
  readonly closeBatchEditPanel: () => void;
  readonly applyBatchEdit: () => void;

  readonly reset: () => void;
}

export const useImportWizardStore = create<ImportWizardState>()(
  immer((set) => ({
    ...INITIAL_STATE,

    setStep: (step) => set({ step }),
    nextStep: () =>
      set((state) => {
        state.step = nextWizardStep(state.step);
      }),
    prevStep: () =>
      set((state) => {
        state.step = prevWizardStep(state.step);
      }),

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

    setDetectedMapping: (mapping) =>
      set({ detectedMapping: mapping, columnMapping: mapping }),
    updateColumnMapping: (column, field) =>
      set((state) => {
        const draft = state.columnMapping;
        if (field === undefined) {
          delete draft[column];
          return;
        }
        draft[column] = field;
      }),
    confirmMapping: (mapping) => set({ columnMapping: mapping }),

    setRows: (rows) => set({ rows }),
    updateRow: (id, updates) =>
      set((state) => {
        const draft = state.rows;
        const idx = draft.findIndex((r) => r.id === id);
        if (idx === -1) {
          return;
        }
        const row = draft[idx];
        if (!row) {
          return;
        }
        Object.assign(row, updates);
        // SECURITY: title change invalidates anonymization entry at this index.
        // Caller (anonymization step hook) MUST re-run detection after updating.
        if (updates.title !== undefined && import.meta.env.DEV) {
          console.warn(
            '[ImportWizardStore] Row title changed — anonymization entry at index may be stale',
          );
        }
      }),
    setAnonymizationEntries: (entries) => {
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

    setSelectedRowIds: (ids) => set({ selectedRowIds: ids }),
    setSubmitting: (submitting) => set({ isSubmitting: submitting }),
    setSubmitError: (error) => set({ submitError: error }),

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
        const draft = state.rows;
        pending.similarRowIds.forEach((rowId) => {
          const idx = draft.findIndex((r) => r.id === rowId);
          if (idx === -1) {
            return;
          }
          const row = draft[idx];
          if (!row) {
            return;
          }
          Object.assign(row, { [pending.field]: pending.newValue });
        });
        state.batchEditPanel = { isOpen: false, pendingEdit: undefined };
      }),

    // Reset — clears all state including raw PII from memory
    reset: () => set(INITIAL_STATE),
  })),
);
