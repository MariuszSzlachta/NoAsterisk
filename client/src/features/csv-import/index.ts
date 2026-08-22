// CSV Import — Public API
// Only these exports are available to pages and other features.

// Model — parsers & transformers
export { parseCsvFile, CsvParseError } from './model/parsing/csv-parser';
export { detectDateFormat, parseDate, parseDateFlexible } from './model/parsing/date-parser';
export { detectAmountLocale, parseAmount } from './model/parsing/amount-parser';
export {
  detectEncoding,
  decodeBuffer,
  decodeBufferWithWarning,
  countReplacementChars,
} from './model/parsing/encoding-detector';
export { autoDetectMapping, normalizeHeader, isDomainField, hasRequiredFields } from './model/column-mapping/column-mapper';
export { transformRows } from './model/transformation/row-transformer';
export { findSimilarRows } from './model/transformation/find-similar-rows';
export { createImportChunks, computeContentHash, computeBatchHash } from './model/submission/import-chunks';
export {
  detectDuplicatesInBatch,
  detectDuplicatesAgainstExisting,
} from './model/transformation/duplicate-detector';
export { anonymizeTitle, processRows } from './model/anonymization/pipeline';
export {
  buildFromStubs,
  createDictionaryProvider,
  devDictionaryProvider,
} from './model/anonymization/dictionaries/dictionary.provider';
export { detectBankFromHeaders } from './model/column-mapping/bank-profiles';

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

export type { DecodeWarning } from './model/parsing/encoding-detector';
