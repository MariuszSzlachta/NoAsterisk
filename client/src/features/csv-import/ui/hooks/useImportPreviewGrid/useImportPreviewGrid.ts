import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import type { TransactionRow } from '#features/csv-import/model/types';

interface ImportStats {
  readonly total: number;
  readonly ok: number;
  readonly warnings: number;
  readonly duplicates: number;
  readonly errors: number;
}

interface ImportPreviewGridResult {
  readonly rows: ReadonlyArray<TransactionRow>;
  readonly stats: ImportStats;
  readonly handleSelectionChange: (ids: string[]) => void;
}

const computeStats = (rows: ReadonlyArray<TransactionRow>): ImportStats => {
  let ok = 0;
  let warnings = 0;
  let duplicates = 0;
  let errors = 0;
  for (const row of rows) {
    switch (row.status) {
      case 'ok':
        ok++;
        break;
      case 'warning':
        warnings++;
        break;
      case 'duplicate':
        duplicates++;
        break;
      case 'error':
        errors++;
        break;
    }
  }
  return { total: rows.length, ok, warnings, duplicates, errors };
};

export const useImportPreviewGrid = (): ImportPreviewGridResult => {
  const rows = useImportWizardStore((s) => s.rows);
  const setSelectedRowIds = useImportWizardStore((s) => s.setSelectedRowIds);

  const stats = computeStats(rows);

  const handleSelectionChange = (ids: string[]): void => {
    setSelectedRowIds(ids);
  };

  return {
    rows,
    stats,
    handleSelectionChange,
  };
};
