import { useTranslation } from 'react-i18next';

import { BatchEditPanel } from '#features/csv-import/ui/BatchEditPanel';
import { createImportGridColumns } from '#features/csv-import/ui/constants/create-import-grid-columns';
import { IMPORT_GRID_ROW_HEIGHT } from '#features/csv-import/ui/constants/import-grid-row-height';
import { FilterToolbar } from '#features/csv-import/ui/FilterToolbar';
import { useBatchEditPanel } from '#features/csv-import/ui/hooks/useBatchEditPanel';
import { useImportPreviewGrid } from '#features/csv-import/ui/hooks/useImportPreviewGrid';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import { usePreviewFilters } from '#features/csv-import/ui/hooks/usePreviewFilters';
import { DataGrid } from '#shared/adapters/grid';
import { Badge } from '#shared/ui/Badge';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { getRowId } from '#features/csv-import/ui/ImportPreviewGrid/get-row-id';

export const ImportPreviewGrid = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { rows, handleSelectionChange } = useImportPreviewGrid();
  const { handleCellEdit } = useBatchEditPanel();
  const { handleNextStep, handlePrevStep } = useImportWizard();
  const { filters, filteredRows, setTypeFilter, setDateFrom, setDateTo } =
    usePreviewFilters(rows);

  const columns = createImportGridColumns(t);

  const stats = {
    total: filteredRows.length,
    ok: filteredRows.filter((r) => r.status === 'ok').length,
    warnings: filteredRows.filter((r) => r.status === 'warning').length,
    duplicates: filteredRows.filter((r) => r.status === 'duplicate').length,
    errors: filteredRows.filter((r) => r.status === 'error').length,
  };

  const incomeCount = rows.filter((r) => r.amount > 0).length;
  const expenseCount = rows.filter((r) => r.amount < 0).length;

  const importableCount = filteredRows.filter(
    (r) => r.status === 'ok' || r.status === 'warning',
  ).length;


  const totalErrors = rows.filter((r) => r.status === 'error').length;
  const hasErrors = totalErrors > 0;

  return (
    <div className="flex flex-col gap-4 pb-8">
      {hasErrors && (
        <div className="flex items-center gap-3 rounded-lg border border-expense/30 bg-expense/5 px-4 py-3">
          <span className="text-sm text-expense">
            {t('import.preview.errorBanner', {
              count: totalErrors,
              total: rows.length,
            })}
          </span>
          <Button variant="secondary" size="sm" onClick={handlePrevStep}>
            {t('import.preview.backToMapping')}
          </Button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Badge variant="soft" color="neutral">
          {t('import.preview.rows', { count: stats.total })}
        </Badge>
        {stats.ok > 0 && (
          <Badge variant="soft" color="income">
            {t('import.preview.ok', { count: stats.ok })}
          </Badge>
        )}
        {stats.warnings > 0 && (
          <Badge variant="soft" color="warning">
            {t('import.preview.warnings', { count: stats.warnings })}
          </Badge>
        )}
        {stats.duplicates > 0 && (
          <Badge variant="soft" color="neutral">
            {t('import.preview.duplicates', { count: stats.duplicates })}
          </Badge>
        )}
        {stats.errors > 0 && (
          <Badge variant="soft" color="expense">
            {t('import.preview.errors', { count: stats.errors })}
          </Badge>
        )}
      </div>

      <FilterToolbar
        typeFilter={filters.type}
        dateFrom={filters.dateFrom}
        dateTo={filters.dateTo}
        onTypeChange={setTypeFilter}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        incomeCount={incomeCount}
        expenseCount={expenseCount}
        totalCount={rows.length}
      />

      <BatchEditPanel />

      <Card className="max-h-[60vh] overflow-auto p-0">
        <DataGrid
          rows={[...filteredRows]}
          columns={columns}
          getRowId={getRowId}
          onCellEdit={handleCellEdit}
          rowHeight={IMPORT_GRID_ROW_HEIGHT}
          rowSelection="multiple"
          onSelectionChange={handleSelectionChange}
        />
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={handlePrevStep}>
          {t('import.nav.back')}
        </Button>
        <Button
          onClick={handleNextStep}
          disabled={importableCount === 0 || hasErrors}
        >
          {t('import.nav.continue', { count: importableCount })}
        </Button>
      </div>
    </div>
  );
};
