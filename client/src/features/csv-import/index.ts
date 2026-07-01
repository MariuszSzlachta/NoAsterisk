// CSV Import — Public API
// Only these exports are available to pages and other features.

// Model — parsers & transformers
export { parseCsvFile, CsvParseError } from './model/parser/csv-parser';
export { detectDateFormat, parseDate, parseDateFlexible } from './model/parser/date-parser';
export { detectAmountLocale, parseAmount } from './model/parser/amount-parser';
export {
  detectEncoding,
  decodeBuffer,
  decodeBufferWithWarning,
  countReplacementChars,
} from './model/parser/encoding-detector';
export { autoDetectMapping, normalizeHeader, isDomainField, hasRequiredFields } from './model/column-mapper';
export { transformRows } from './model/row-transformer';
export { findSimilarRows } from './model/find-similar-rows';
export { createImportChunks, computeContentHash, computeBatchHash } from './model/import-chunks';
export {
  detectDuplicatesInBatch,
  detectDuplicatesAgainstExisting,
} from './model/duplicate-detector';
export { anonymizeTitle, processRows } from './model/anonymizer/pipeline';
export {
  createDictionaryProvider,
  devDictionaryProvider,
} from './model/anonymizer/dictionaries/dictionary-provider';

// Store
export { useImportWizardStore } from './store/useImportWizardStore';

// API
export { useImportMutation } from './api/useImportMutation';

// UI — Components
export { ColumnMappingStep } from './ui/ColumnMappingStep';
export { ImportPreviewGrid } from './ui/ImportPreviewGrid';
export { BatchEditPanel } from './ui/BatchEditPanel';
export { ImportConfirmStep } from './ui/ImportConfirmStep';

// UI — Hooks
export { useImportWizard } from './ui/hooks/useImportWizard';
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

export type { DecodeWarning } from './model/parser/encoding-detector';
