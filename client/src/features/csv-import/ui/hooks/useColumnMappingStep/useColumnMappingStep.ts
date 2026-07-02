import { useTranslation } from 'react-i18next';

import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import { isDomainField } from '#features/csv-import/model/column-mapper';
import type { ColumnMapping, CsvRow } from '#features/csv-import/model/types';
import type { SelectOption } from '#shared/ui/Select';

const MAX_PREVIEW_ROWS = 5;

interface ColumnMappingStepResult {
  readonly headers: readonly string[];
  readonly previewRows: readonly CsvRow[];
  readonly columnMapping: ColumnMapping;
  readonly fieldOptions: readonly SelectOption[];
  readonly isMappingComplete: boolean;
  readonly isProcessing: boolean;
  readonly handleFieldChange: (column: string, value: string) => void;
  readonly handleConfirm: () => void;
  readonly handlePrevStep: () => void;
  readonly handleSaveProfile: () => void;
  readonly getExampleValue: (header: string) => string;
}

export const useColumnMappingStep = (): ColumnMappingStepResult => {
  const { t } = useTranslation();
  const parsedData = useImportWizardStore((s) => s.parsedData);
  const columnMapping = useImportWizardStore((s) => s.columnMapping);
  const updateColumnMapping = useImportWizardStore((s) => s.updateColumnMapping);
  const { isMappingComplete, isProcessing, handleMappingConfirm, handlePrevStep } =
    useImportWizard();

  const headers = parsedData?.headers ?? [];
  const rows = parsedData?.rows ?? [];
  const previewRows = rows.slice(0, MAX_PREVIEW_ROWS);

  const fieldOptions: SelectOption[] = [
    { value: '', label: t('import.mapping.skip') },
    { value: 'date', label: t('import.mapping.fields.date') },
    { value: 'title', label: t('import.mapping.fields.title') },
    { value: 'amount', label: t('import.mapping.fields.amount') },
    { value: 'currency', label: t('import.mapping.fields.currency') },
    { value: 'balance', label: t('import.mapping.fields.balance') },
    { value: 'debit', label: t('import.mapping.fields.debit') },
    { value: 'credit', label: t('import.mapping.fields.credit') },
  ];

  const handleFieldChange = (column: string, value: string): void => {
    if (value === '' || !isDomainField(value)) {
      updateColumnMapping(column, undefined);
    } else {
      updateColumnMapping(column, value);
    }
  };

  const getExampleValue = (header: string): string => {
    const firstRow = rows[0];
    if (!firstRow) {
      return '';
    }
    return firstRow[header] ?? '';
  };

  // TODO: implement save profile dialog
  const handleSaveProfile = (): void => {
    // Will open a dialog to name and save the current mapping
  };

  return {
    headers,
    previewRows,
    columnMapping,
    fieldOptions,
    isMappingComplete,
    isProcessing,
    handleFieldChange,
    handleConfirm: handleMappingConfirm,
    handlePrevStep,
    handleSaveProfile,
    getExampleValue,
  };
};
