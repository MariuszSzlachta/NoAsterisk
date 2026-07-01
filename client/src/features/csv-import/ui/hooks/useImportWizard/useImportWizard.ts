import { useState } from 'react';

import { hasRequiredFields } from '#features/csv-import/model/column-mapper';
import { detectDuplicatesInBatch } from '#features/csv-import/model/duplicate-detector';
import { parseCsvFile } from '#features/csv-import/model/parser/csv-parser';
import { autoDetectMapping } from '#features/csv-import/model/column-mapper';
import { processRows } from '#features/csv-import/model/anonymizer/pipeline';
import { devDictionaryProvider } from '#features/csv-import/model/anonymizer/dictionaries/dictionary-provider';
import { transformRows } from '#features/csv-import/model/row-transformer';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import type { WizardStep } from '#features/csv-import/model/types';

interface ImportWizardResult {
  readonly step: WizardStep;
  readonly isFileLoaded: boolean;
  readonly isMappingComplete: boolean;
  readonly isProcessing: boolean;
  readonly hasRows: boolean;
  readonly rowCount: number;
  readonly parseError: string | undefined;
  readonly handleFileSelect: (file: File) => Promise<void>;
  readonly handleMappingConfirm: () => Promise<void>;
  readonly handleNextStep: () => void;
  readonly handlePrevStep: () => void;
  readonly handleReset: () => void;
}

export const useImportWizard = (): ImportWizardResult => {
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
  const setAnonymizationEntries = useImportWizardStore((s) => s.setAnonymizationEntries);
  const nextStep = useImportWizardStore((s) => s.nextStep);
  const prevStep = useImportWizardStore((s) => s.prevStep);
  const reset = useImportWizardStore((s) => s.reset);

  // BUG-3 fix: double-click guard
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: File): Promise<void> => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(true);
    setFile(file);

    try {
      const parsed = await parseCsvFile(file);
      setParsedData(parsed);

      const mapping = autoDetectMapping(parsed.headers);
      setDetectedMapping(mapping);

      nextStep();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to parse file';
      setParseError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMappingConfirm = async (): Promise<void> => {
    if (isProcessing || !parsedData) {
      return;
    }
    setIsProcessing(true);

    try {
      // Transform raw CSV rows to typed TransactionRows
      const transformed = transformRows(parsedData.rows, columnMapping);

      // Anonymize titles — raw data NEVER leaves the browser
      const dictionaries = await devDictionaryProvider.loadAll();
      const titles = transformed.map((r) => r.title);
      const anonymizationEntries = processRows(titles, dictionaries);
      setAnonymizationEntries(anonymizationEntries);

      // Apply anonymized titles to rows
      const anonymizedRows = transformed.map((row, idx) => {
        const entry = anonymizationEntries[idx];
        if (entry && entry.status === 'anonymized') {
          return { ...row, title: entry.anonymizedTitle };
        }
        return row;
      });

      // Run duplicate detection on anonymized rows
      const withDuplicates = detectDuplicatesInBatch(anonymizedRows);

      setRows(withDuplicates);
      nextStep();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Processing failed';
      setParseError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // BUG-1 + HIGH-2 fix: navigation exposed
  const handleNextStep = (): void => {
    nextStep();
  };

  const handlePrevStep = (): void => {
    prevStep();
  };

  const handleReset = (): void => {
    reset();
  };

  const isMappingComplete = hasRequiredFields(columnMapping);

  return {
    step,
    isFileLoaded: parsedData !== undefined,
    isMappingComplete,
    isProcessing,
    hasRows: rows.length > 0,
    rowCount: rows.length,
    parseError,
    handleFileSelect,
    handleMappingConfirm,
    handleNextStep,
    handlePrevStep,
    handleReset,
  };
};
