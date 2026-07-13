import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import type { TransactionRow } from '#features/csv-import/model/types';

interface ImportPreviewGridResult {
  readonly rows: ReadonlyArray<TransactionRow>;
  readonly handleSelectionChange: (ids: string[]) => void;
}

export const useImportPreviewGrid = (): ImportPreviewGridResult => {
  const rows = useImportWizardStore((s) => s.rows);
  const setSelectedRowIds = useImportWizardStore((s) => s.setSelectedRowIds);

  const handleSelectionChange = (ids: string[]): void => {
    setSelectedRowIds(ids);
  };

  return {
    rows,
    handleSelectionChange,
  };
};
