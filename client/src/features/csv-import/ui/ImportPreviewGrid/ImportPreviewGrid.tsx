import { useTranslation } from 'react-i18next';

import { DataGrid } from '#shared/adapters/grid';
import { Badge } from '#shared/ui/Badge';
import { Card } from '#shared/ui/Card';

import type { TransactionRow } from '#features/csv-import/model/types';
import { useImportPreviewGrid } from '#features/csv-import/ui/hooks/useImportPreviewGrid';
import {
  createImportGridColumns,
  IMPORT_GRID_PAGE_SIZE,
  IMPORT_GRID_ROW_HEIGHT,
} from '#features/csv-import/ui/constants/grid-columns';

const getRowId = (row: TransactionRow): string => row.id;

export const ImportPreviewGrid = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { rows, stats, handleCellEdit, handleSelectionChange } =
    useImportPreviewGrid();

  const columns = createImportGridColumns(t);

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
    </div>
  );
};
