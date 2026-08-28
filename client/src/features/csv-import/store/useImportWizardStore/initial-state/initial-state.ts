import type { ImportWizardData } from '#features/csv-import/store/useImportWizardStore/import-wizard-data';

export const INITIAL_STATE: ImportWizardData = {
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
