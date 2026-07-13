import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '#shared/ui/Button';

import { DataPreviewTable } from '../DataPreviewTable';
import { FieldAssignmentRow } from '../FieldAssignmentRow';
import { SaveProfileBar } from '../SaveProfileBar';
import { useColumnMappingStep } from '../hooks/useColumnMappingStep';

export const ColumnMappingStep = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    headers,
    previewRows,
    columnMapping,
    fieldOptions,
    isMappingComplete,
    isProcessing,
    selectedPreviewRowIndex,
    handleFieldChange,
    handleConfirm,
    handlePrevStep,
    handleSaveProfile,
    handlePreviewRowSelect,
    getExampleValue,
    isMergedColumn,
    getMergePartners,
  } = useColumnMappingStep();

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        {/* Heading */}
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {t('import.mapping.title')}
        </h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {t('import.mapping.description')}
        </p>

        {/* Data preview table */}
        <div className="mt-5">
          <DataPreviewTable
            headers={headers}
            rows={previewRows}
            selectedRowIndex={selectedPreviewRowIndex}
            onRowSelect={handlePreviewRowSelect}
          />
        </div>

        {/* Field assignment section */}
        <p className="mt-6 mb-2 text-[11px] font-medium uppercase tracking-wide text-subtle">
          {t('import.mapping.fieldAssignment')}
        </p>
        <div className="flex flex-col gap-2">
          {headers.map((header) => (
            <FieldAssignmentRow
              key={header}
              header={header}
              exampleValue={getExampleValue(header)}
              value={columnMapping[header] ?? ''}
              options={fieldOptions}
              isMerged={isMergedColumn(header)}
              mergePartners={getMergePartners(header)}
              onFieldChange={handleFieldChange}
            />
          ))}
        </div>

        {/* Save profile bar */}
        <div className="mt-5">
          <SaveProfileBar onSave={handleSaveProfile} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={handlePrevStep}>
          {t('import.nav.back')}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!isMappingComplete || isProcessing}
        >
          {t('import.upload.next')}
          <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
};
