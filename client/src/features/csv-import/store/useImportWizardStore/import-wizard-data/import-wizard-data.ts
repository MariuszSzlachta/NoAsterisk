import type { PendingBatchEdit } from '#features/csv-import/store/useImportWizardStore/pending-batch-edit';
import type {
  AnonymizationEntry,
  ColumnMapping,
  ParsedCsvData,
  TransactionRow,
  WizardStep,
} from '#features/csv-import/model/types';

export interface ImportWizardData {
  readonly step: WizardStep;
  readonly file: File | undefined;
  readonly parsedData: ParsedCsvData | undefined;
  readonly parseError: string | undefined;
  readonly columnMapping: ColumnMapping;
  readonly detectedMapping: ColumnMapping;
  readonly rows: ReadonlyArray<TransactionRow>;
  readonly anonymizationEntries: ReadonlyArray<AnonymizationEntry>;
  readonly isSubmitting: boolean;
  readonly submitError: string | undefined;
  readonly batchId: string | undefined;
  readonly selectedRowIds: ReadonlyArray<string>;
  readonly batchEditPanel: {
    readonly isOpen: boolean;
    readonly pendingEdit: PendingBatchEdit | undefined;
  };
}
