import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { DataGrid } from '#shared/adapters/grid';
import { Button } from '#shared/ui/Button';
import { FilterTabs } from '#shared/ui/FilterTabs';

import { AnonymizationPopover } from '../AnonymizationPopover';
import { useAnonymizationGrid } from '../hooks/useAnonymizationGrid';
import { useAnonymizationRowActions } from '../hooks/useAnonymizationRowActions';
import { useAnonymizationStep } from '../hooks/useAnonymizationStep';
import { useImportWizard } from '../hooks/useImportWizard';

import { CELL_RENDERERS, LEGEND_ITEMS } from './constants';

// ─── Component ───────────────────────────────────────────────────

export const AnonymizationStep = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { handleNextStep, handlePrevStep } = useImportWizard();
  const {
    stats,
    activeFilter,
    selectedEntry,
    isEditing,
    editValue,
    handleBulkAccept,
    handleSelectRow,
    handleClosePopover,
    handleRestore,
    handleRestoreSelected,
    handleStartEdit,
    handleEditValueChange,
    handleEditSave,
    handleFilterChange,
  } = useAnonymizationStep();
  const { columns, rows, getRowId, getRowClass } = useAnonymizationGrid(CELL_RENDERERS, activeFilter);

  const getRowActions = useAnonymizationRowActions({
    onEdit: handleSelectRow,
    onRestore: handleRestore,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t('import.anonymization.heading')}
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {t('import.anonymization.description')}
            </p>
          </div>
          <Button onClick={handleBulkAccept}>
            <CheckCircle2 size={16} />
            {t('import.anonymization.acceptAll')}
          </Button>
        </div>

        {/* Legend + hint */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {LEGEND_ITEMS.map((item) => (
              <span key={item.key} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.color}`} />
                {t(item.i18nKey)}
              </span>
            ))}
          </div>
          <span className="text-[12px] text-subtle">
            {t('import.anonymization.hint')}
          </span>
        </div>

        {/* Filter toolbar */}
        <div className="mt-3">
          <FilterTabs
            tabs={[
              { id: 'all', label: t('import.anonymization.filter.all'), count: stats.totalScanned },
              { id: 'safe', label: t('import.anonymization.legend.safe'), count: stats.safeCount },
              { id: 'needs_review', label: t('import.anonymization.legend.needsReview'), count: stats.needsReviewCount },
              { id: 'anonymized', label: t('import.anonymization.legend.anonymized'), count: stats.anonymizedCount },
            ]}
            activeTab={activeFilter}
            onTabChange={handleFilterChange}
          />
        </div>

        {/* Grid */}
        <div className="mt-4 overflow-x-auto">
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={getRowId}
            getRowClass={getRowClass}
            rowActions={getRowActions}
            rowHeight={40}
          />
        </div>

        {/* Stats bar */}
        <div className="mt-3 flex items-center gap-3 text-[12px] text-muted-foreground">
          <span>
            {t('import.anonymization.stats.scanned', { count: stats.totalScanned })}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-expense" />
            {t('import.anonymization.stats.anonymized', { count: stats.anonymizedCount })}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-warning" />
            {t('import.anonymization.stats.needsReview', { count: stats.needsReviewCount })}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={handlePrevStep}>
          {t('import.nav.back')}
        </Button>
        <Button onClick={handleNextStep}>
          {t('import.upload.next')}
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Edit Popover — triggered from dropdown action */}
      {selectedEntry && (
        <AnonymizationPopover
          entry={selectedEntry}
          isEditing={isEditing}
          editValue={editValue}
          onClose={handleClosePopover}
          onRestore={handleRestoreSelected}
          onStartEdit={handleStartEdit}
          onEditValueChange={handleEditValueChange}
          onEditSave={handleEditSave}
        />
      )}
    </div>
  );
};
