import { useState } from 'react';

import { dictionaryProvider } from '#features/csv-import/api/dictionaryProvider';
import { processRows } from '#features/csv-import/model/anonymization/pipeline/process-rows';
import { autoDetectMapping } from '#features/csv-import/model/column-mapping/auto-detect';
import { hasRequiredFields } from '#features/csv-import/model/column-mapping/validators/has-required-fields';
import { parseCsvFile } from '#features/csv-import/model/parsing/csv-parser/parse-csv-file';
import { detectDuplicatesInBatch } from '#features/csv-import/model/transformation/duplicate-detector/detect-duplicates-in-batch';
import { transformRows } from '#features/csv-import/model/transformation/row-transformer';
import type { WizardStep } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

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
  const setAnonymizationEntries = useImportWizardStore(
    (s) => s.setAnonymizationEntries,
  );
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

      if (import.meta.env.DEV) {
        console.info('[csv-import] Parse OK', {
          file: file.name,
          size: file.size,
          headers: parsed.headers,
          rowCount: parsed.rows.length,
          separator: parsed.separator,
          encoding: parsed.encoding,
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to parse file';

      if (import.meta.env.DEV) {
        console.warn('[csv-import] Parse FAILED', {
          file: file.name,
          size: file.size,
          type: file.type,
          error: err,
        });
      }

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
      const transformed = transformRows(parsedData.rows, columnMapping);

      // Anonymize titles — raw data NEVER leaves the browser
      const dictionaries = await dictionaryProvider.loadAll();
      const titles = transformed.map((r) => r.title);
      const anonymizationEntries = processRows(titles, dictionaries);
      setAnonymizationEntries(anonymizationEntries);

      const anonymizedRows = transformed.map((row, idx) => {
        const entry = anonymizationEntries[idx];
        if (entry && entry.status === 'anonymized') {
          return { ...row, title: entry.anonymizedTitle };
        }
        return row;
      });

      const withDuplicates = detectDuplicatesInBatch(anonymizedRows);

      setRows(withDuplicates);
      nextStep();

      if (import.meta.env.DEV) {
        console.info('[csv-import] Mapping confirm OK', {
          inputRows: parsedData.rows.length,
          transformedRows: transformed.length,
          anonymized: anonymizationEntries.filter(
            (e) => e.status === 'anonymized',
          ).length,
          duplicates: withDuplicates.filter((r) => r.status === 'duplicate').length,
          mapping: columnMapping,
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Processing failed';

      if (import.meta.env.DEV) {
        console.warn('[csv-import] Mapping confirm FAILED', {
          rowCount: parsedData.rows.length,
          mapping: columnMapping,
          error: err,
        });
      }

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
