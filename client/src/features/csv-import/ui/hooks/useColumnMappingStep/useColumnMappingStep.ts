import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import { isDomainField } from '#features/csv-import/model/column-mapping/column-mapper';
import { MERGEABLE_FIELDS } from '#features/csv-import/model/column-mapping';
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
  readonly selectedPreviewRowIndex: number;
  readonly handleFieldChange: (column: string, value: string) => void;
  readonly handleConfirm: () => void;
  readonly handlePrevStep: () => void;
  readonly handleSaveProfile: () => void;
  readonly handlePreviewRowSelect: (index: number) => void;
  readonly getExampleValue: (header: string) => string;
  readonly isMergedColumn: (header: string) => boolean;
  readonly getMergePartners: (header: string) => readonly string[];
}

export const useColumnMappingStep = (): ColumnMappingStepResult => {
  const { t } = useTranslation();
  const parsedData = useImportWizardStore((s) => s.parsedData);
  const columnMapping = useImportWizardStore((s) => s.columnMapping);
  const updateColumnMapping = useImportWizardStore((s) => s.updateColumnMapping);
  const { isMappingComplete, isProcessing, handleMappingConfirm, handlePrevStep } =
    useImportWizard();

  const [selectedPreviewRowIndex, setSelectedPreviewRowIndex] = useState(0);

  const headers = parsedData?.headers ?? [];
  const rows = parsedData?.rows ?? [];
  const previewRows = rows.slice(0, MAX_PREVIEW_ROWS);
  if (import.meta.env.DEV && parsedData) {
    console.info('[column-mapping] Parsed data', {
      headers,
      totalRows: rows.length,
      previewRows,
      firstRow: rows[0],
      rows,
    });

    // Extract unique categories if #Kategoria column exists
    const categoryHeader = headers.find((h) => h.toLowerCase().includes('kategoria') || h.toLowerCase().includes('category'));
    if (categoryHeader) {
      const uniqueCategories = [...new Set(rows.map((r) => r[categoryHeader]).filter(Boolean))].sort();
      console.info('[column-mapping] Unique categories from CSV', {
        column: categoryHeader,
        count: uniqueCategories.length,
        categories: uniqueCategories,
      });
    }
  }

  const fieldOptions: SelectOption[] = [
    { value: '', label: t('import.mapping.skip') },
    { value: 'date', label: t('import.mapping.fields.date') },
    { value: 'title', label: t('import.mapping.fields.title') },
    { value: 'amount', label: t('import.mapping.fields.amount') },
    { value: 'currency', label: t('import.mapping.fields.currency') },
    { value: 'balance', label: t('import.mapping.fields.balance') },
    { value: 'debit', label: t('import.mapping.fields.debit') },
    { value: 'credit', label: t('import.mapping.fields.credit') },
    { value: 'category', label: t('import.mapping.fields.category') },
    { value: 'source', label: t('import.mapping.fields.source') },
    { value: 'recipient', label: t('import.mapping.fields.recipient') },
    { value: 'counterpart', label: t('import.mapping.fields.counterpart') },
    { value: 'reference', label: t('import.mapping.fields.reference') },
  ];

  const handleFieldChange = (column: string, value: string): void => {
    if (value === '' || !isDomainField(value)) {
      updateColumnMapping(column, undefined);
    } else {
      updateColumnMapping(column, value);
    }
  };

  const isMergedColumn = (header: string): boolean => {
    const field = columnMapping[header];
    if (!field || !MERGEABLE_FIELDS.has(field)) {
      return false;
    }
    const columnsWithSameField = Object.entries(columnMapping).filter(
      ([, f]) => f === field,
    );
    return columnsWithSameField.length > 1;
  };

  const getMergePartners = (header: string): readonly string[] => {
    const field = columnMapping[header];
    if (!field || !MERGEABLE_FIELDS.has(field)) {
      return [];
    }
    return Object.entries(columnMapping)
      .filter(([col, f]) => f === field && col !== header)
      .map(([col]) => col);
  };

  const getExampleValue = (header: string): string => {
    const row = rows[selectedPreviewRowIndex];
    if (!row) {
      return '';
    }
    return row[header] ?? '';
  };

  const handlePreviewRowSelect = (index: number): void => {
    setSelectedPreviewRowIndex(index);
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
    selectedPreviewRowIndex,
    handleFieldChange,
    handleConfirm: handleMappingConfirm,
    handlePrevStep,
    handleSaveProfile,
    handlePreviewRowSelect,
    getExampleValue,
    isMergedColumn,
    getMergePartners,
  };
};
