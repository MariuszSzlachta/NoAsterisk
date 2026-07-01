import { hasRequiredFields } from '#features/csv-import/model/column-mapper';
import { detectDuplicatesInBatch } from '#features/csv-import/model/duplicate-detector';
import { parseCsvFile } from '#features/csv-import/model/parser/csv-parser';
import { autoDetectMapping } from '#features/csv-import/model/column-mapper';
import { transformRows } from '#features/csv-import/model/row-transformer';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import type { WizardStep } from '#features/csv-import/model/types';

interface ImportWizardActions {
  readonly step: WizardStep;
  readonly isFileLoaded: boolean;
  readonly isMappingComplete: boolean;
  readonly hasRows: boolean;
  readonly rowCount: number;
  readonly parseError: string | undefined;
  readonly handleFileSelect: (file: File) => void;
  readonly handleMappingConfirm: () => void;
  readonly handleStepChange: (step: WizardStep) => void;
  readonly handleReset: () => void;
}

export const useImportWizard = (): ImportWizardActions => {
  const step = useImportWizardStore((s) => s.step);
  const parsedData = useImportWizardStore((s) => s.parsedData);
  const columnMapping = useImportWizardStore((s) => s.columnMapping);
  const rows = useImportWizardStore((s) => s.rows);
  const parseError = useImportWizardStore((s) => s.parseError);

  const setFile = useImportWizardStore((s) => s.setFile);
  const setParsedData = useImportWizardStore((s) => s.setParsedData);
  const setParseError = useImportWizardStore((s) => s.setParseError);
  const setDetectedMapping = useImportWizardStore((s) => s.setDetectedMapping);
  const setRows = useImportWizardStore((s) => s.setRows);
  const setStep = useImportWizardStore((s) => s.setStep);
  const nextStep = useImportWizardStore((s) => s.nextStep);
  const reset = useImportWizardStore((s) => s.reset);

  const handleFileSelect = async (file: File): Promise<void> => {
    setFile(file);

    try {
      const parsed = await parseCsvFile(file);
      setParsedData(parsed);

      const mapping = autoDetectMapping(parsed.headers);
      setDetectedMapping(mapping);

      nextStep();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Nie udało się sparsować pliku';
      setParseError(message);
    }
  };

  const handleMappingConfirm = (): void => {
    if (!parsedData) {
      return;
    }

    const transformed = transformRows(parsedData.rows, columnMapping);
    const withDuplicates = detectDuplicatesInBatch(transformed);

    setRows(withDuplicates);
    nextStep();
  };

  const handleStepChange = (newStep: WizardStep): void => {
    setStep(newStep);
  };

  const handleReset = (): void => {
    reset();
  };

  const isMappingComplete = hasRequiredFields(columnMapping);

  return {
    step,
    isFileLoaded: parsedData !== undefined,
    isMappingComplete,
    hasRows: rows.length > 0,
    rowCount: rows.length,
    parseError,
    handleFileSelect,
    handleMappingConfirm,
    handleStepChange,
    handleReset,
  };
};
