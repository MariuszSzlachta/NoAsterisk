import { useTranslation } from 'react-i18next';

import { DataGrid } from '#shared/adapters/grid';
import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';

import type { TransactionRow } from '#features/csv-import/model/types';
import { BatchEditPanel } from '#features/csv-import/ui/BatchEditPanel';
import { useBatchEditPanel } from '#features/csv-import/ui/hooks/useBatchEditPanel';
import { useImportPreviewGrid } from '#features/csv-import/ui/hooks/useImportPreviewGrid';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import {
  createImportGridColumns,
  IMPORT_GRID_PAGE_SIZE,
  IMPORT_GRID_ROW_HEIGHT,
} from '#features/csv-import/ui/constants/grid-columns';

const getRowId = (row: TransactionRow): string => row.id;

export const ImportPreviewGrid = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { rows, stats, handleSelectionChange } = useImportPreviewGrid();
  const { handleCellEdit } = useBatchEditPanel();
  const { handleNextStep, handlePrevStep } = useImportWizard();

  const columns = createImportGridColumns(t);

  const importableCount = rows.filter(
    (r) => r.status === 'ok' || r.status === 'warning',
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Badge variant="default">
          {t('import.preview.rows', { count: stats.total })}
        </Badge>
        {stats.ok > 0 && (
          <Badge variant="success">
            {t('import.preview.ok', { count: stats.ok })}
          </Badge>
        )}
        {stats.warnings > 0 && (
          <Badge variant="warning">
            {t('import.preview.warnings', { count: stats.warnings })}
          </Badge>
        )}
        {stats.duplicates > 0 && (
          <Badge variant="muted">
            {t('import.preview.duplicates', { count: stats.duplicates })}
          </Badge>
        )}
        {stats.errors > 0 && (
          <Badge variant="destructive">
            {t('import.preview.errors', { count: stats.errors })}
          </Badge>
        )}
      </div>

      <BatchEditPanel />

      <Card className="overflow-hidden p-0">
        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          onCellEdit={handleCellEdit}
          pageSize={IMPORT_GRID_PAGE_SIZE}
          rowHeight={IMPORT_GRID_ROW_HEIGHT}
          rowSelection="multiple"
          onSelectionChange={handleSelectionChange}
        />
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handlePrevStep}>
          {t('import.nav.back')}
        </Button>
        <Button onClick={handleNextStep} disabled={importableCount === 0}>
          {t('import.nav.continue', { count: importableCount })}
        </Button>
      </div>
    </div>
  );
};
