// CSV Import — Public API
// Only these exports are available to pages and other features.

// Model — parsers & transformers
export { parseCsvFile } from './model/parsing/csv-parser/parse-csv-file';
export { CsvParseError } from './model/parsing/csv-parser/helpers/csv-parse-error';
export { detectDateFormat } from './model/parsing/date-parser/detect-date-format';
export { parseDate } from './model/parsing/date-parser/parse-date';
export { parseDateFlexible } from './model/parsing/date-parser/parse-date-flexible';
export { detectAmountLocale } from './model/parsing/amount-parser/detect-amount-locale';
export { parseAmount } from './model/parsing/amount-parser/parse-amount';
export { detectEncoding } from './model/parsing/encoding-detector/detect-encoding';
export { decodeBuffer } from './model/parsing/encoding-detector/decode-buffer';
export { decodeBufferWithWarning } from './model/parsing/encoding-detector/decode-buffer-with-warning';
export { countReplacementChars } from './model/parsing/encoding-detector/helpers/count-replacement-chars';
export { autoDetectMapping } from './model/column-mapping/auto-detect';
export { normalizeHeader } from './model/column-mapping/normalize-header';
export { isDomainField } from './model/column-mapping/validators/is-domain-field';
export { hasRequiredFields } from './model/column-mapping/validators/has-required-fields';
export { transformRows } from './model/transformation/row-transformer';
export { findSimilarRows } from './model/transformation/find-similar-rows';
export { createImportChunks } from './model/submission/import-chunks/create-import-chunks';
export { computeContentHash } from './model/submission/import-chunks/compute-content-hash';
export { computeBatchHash } from './model/submission/import-chunks/compute-batch-hash';
export { detectDuplicatesInBatch } from './model/transformation/duplicate-detector/detect-duplicates-in-batch';
export { detectDuplicatesAgainstExisting } from './model/transformation/duplicate-detector/detect-duplicates-against-existing';
export { anonymizeTitle } from './model/anonymization/pipeline/anonymize-title';
export { processRows } from './model/anonymization/pipeline/process-rows';
export { buildFromStubs } from './model/anonymization/dictionaries/build-from-stubs';
export { createDictionaryProvider } from './model/anonymization/dictionaries/dictionary-provider-factory';
export { devDictionaryProvider } from './model/anonymization/dictionaries/dev-provider';
export { detectBankFromHeaders } from './model/column-mapping/bank-profiles/detect-bank-from-headers';

// Store
export { useImportWizardStore } from './store/useImportWizardStore';

// API
export { useImportMutation } from './api/useImportMutation';
export { dictionaryProvider } from './api/dictionaryProvider';

// UI — Components
export { ColumnMappingStep } from './ui/ColumnMappingStep';
export { ImportPreviewGrid } from './ui/ImportPreviewGrid';
export { BatchEditPanel } from './ui/BatchEditPanel';
export { ImportConfirmStep } from './ui/ImportConfirmStep';
export { UploadStepCard } from './ui/UploadStepCard';
export { AnonymizationStep } from './ui/AnonymizationStep';

// UI — Hooks
export { useImportWizard } from './ui/hooks/useImportWizard';
export { useAnonymizationStep } from './ui/hooks/useAnonymizationStep';
export { useBatchEditPanel } from './ui/hooks/useBatchEditPanel';
export { useImportSubmit } from './ui/hooks/useImportSubmit';

// Types
export type {
  ParsedCsvData,
  CsvRow,
  ColumnMapping,
  DomainField,
  TransactionRow,
  AnonymizationEntry,
  DetectionSpan,
  DictionarySet,
  DictionaryProvider,
  WizardStep,
  ImportStats,
  MappingProfile,
  BankProfile,
  UserCorrection,
  ImportRowPayload,
  ImportChunkPayload,
  ImportChunkResult,
  ImportProgress,
} from './model/types';

export type { DecodeWarning } from './model/parsing/types/decode-warning';
