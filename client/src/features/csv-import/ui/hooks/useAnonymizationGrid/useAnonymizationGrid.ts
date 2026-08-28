import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import type { GridColumn } from '#shared/adapters/grid';
import type { StatusFilter } from '#features/csv-import/ui/hooks/useAnonymizationStep/status-filter';
import type { AnonymizationGridRow } from '#features/csv-import/ui/hooks/useAnonymizationGrid/types';
import type { CellRendererMap } from '#features/csv-import/ui/hooks/useAnonymizationGrid/cell-renderer-map';
import { buildColumnsFromMapping } from '#features/csv-import/ui/hooks/useAnonymizationGrid/build-columns-from-mapping';
import { buildGridRows } from '#features/csv-import/ui/hooks/useAnonymizationGrid/build-grid-rows';
import { getRowId } from '#features/csv-import/ui/hooks/useAnonymizationGrid/get-row-id';
import { getRowClass } from '#features/csv-import/ui/hooks/useAnonymizationGrid/get-row-class';

interface AnonymizationGridResult {
  readonly columns: GridColumn<AnonymizationGridRow>[];
  readonly rows: AnonymizationGridRow[];
  readonly getRowId: (row: AnonymizationGridRow) => string;
  readonly getRowClass: (row: AnonymizationGridRow) => string | undefined;
}

export const useAnonymizationGrid = (
  cellRenderers?: CellRendererMap,
  statusFilter?: StatusFilter,
): AnonymizationGridResult => {
  const { t } = useTranslation();

  const { columnMapping, rows, entries } = useImportWizardStore(
    useShallow((s) => ({
      columnMapping: s.columnMapping,
      rows: s.rows,
      entries: s.anonymizationEntries,
    })),
  );

  const columns = useMemo(
    () => buildColumnsFromMapping(columnMapping, t, cellRenderers),
    [columnMapping, t, cellRenderers],
  );

  // INVARIANT: rows and entries arrays maintain same positional mapping (see bullet 1 comment)
  const gridRows = useMemo(() => {
    const allRows = buildGridRows(rows, entries);
    if (!statusFilter || statusFilter === 'all') {
      return allRows;
    }
    return allRows.filter((r) => r.anonymizationStatus === statusFilter);
  }, [rows, entries, statusFilter]);

  return {
    columns,
    rows: gridRows,
    getRowId,
    getRowClass,
  };
};
