import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { useImportWizard } from '#features/csv-import/ui/hooks/useImportWizard';
import { isDomainField } from '#features/csv-import/model/column-mapper';
import type { ColumnMapping } from '#features/csv-import/model/types';

interface ColumnMappingStepResult {
  readonly headers: readonly string[];
  readonly columnMapping: ColumnMapping;
  readonly isMappingComplete: boolean;
  readonly handleFieldChange: (column: string, value: string) => void;
  readonly handleConfirm: () => void;
}

export const useColumnMappingStep = (): ColumnMappingStepResult => {
  const parsedData = useImportWizardStore((s) => s.parsedData);
  const columnMapping = useImportWizardStore((s) => s.columnMapping);
  const updateColumnMapping = useImportWizardStore((s) => s.updateColumnMapping);
  const { isMappingComplete, handleMappingConfirm } = useImportWizard();

  const headers = parsedData?.headers ?? [];

  const handleFieldChange = (column: string, value: string): void => {
    if (value === '' || !isDomainField(value)) {
      updateColumnMapping(column, undefined);
    } else {
      updateColumnMapping(column, value);
    }
  };

  return {
    headers,
    columnMapping,
    isMappingComplete,
    handleFieldChange,
    handleConfirm: handleMappingConfirm,
  };
};
