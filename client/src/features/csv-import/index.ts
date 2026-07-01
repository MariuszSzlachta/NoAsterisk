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

// UI — Components
export { ColumnMappingStep } from './ui/ColumnMappingStep';
export { ImportPreviewGrid } from './ui/ImportPreviewGrid';

// UI — Hooks
export { useImportWizard } from './ui/hooks/useImportWizard';

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
} from './model/types';

export type { DecodeWarning } from './model/parser/encoding-detector';
