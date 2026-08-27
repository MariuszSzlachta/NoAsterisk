// CSV Import Model — Public API
// Re-exports from all sub-modules for unified access.

// Parsing
export { parseCsvFile, CsvParseError } from './parsing/csv-parser';
export {
  detectDateFormat,
  parseDate,
  parseDateFlexible,
} from './parsing/date-parser';
export { detectAmountLocale, parseAmount } from './parsing/amount-parser';
export {
  detectEncoding,
  decodeBuffer,
  decodeBufferWithWarning,
  countReplacementChars,
} from './parsing/encoding-detector';
export type { DecodeWarning } from './parsing/types';
export { detectSeparator } from './parsing/separator-detector';
export { detectDataBoundaries } from './parsing/data-boundary-detector';

// Column Mapping
export { autoDetectMapping } from './column-mapping/auto-detect';
export { normalizeHeader } from './column-mapping/normalize-header';
export { isDomainField } from './column-mapping/validators/is-domain-field';
export { hasRequiredFields } from './column-mapping/validators/has-required-fields';
export { MERGEABLE_FIELDS } from './column-mapping';
export { createHeuristicRegistry } from './column-mapping/heuristics/create-heuristic-registry';
export { defaultHeuristicRegistry } from './column-mapping/heuristics/default-heuristic-registry';
export { createBankProfileRegistry } from './column-mapping/bank-profiles/create-bank-profile-registry';
export { defaultBankProfileRegistry } from './column-mapping/bank-profiles/default-bank-profile-registry';
export { detectBankFromHeaders } from './column-mapping/bank-profiles/detect-bank-from-headers';

// Transformation
export { transformRows } from './transformation/row-transformer';
export {
  detectDuplicatesInBatch,
  detectDuplicatesAgainstExisting,
} from './transformation/duplicate-detector';
export { findSimilarRows } from './transformation/find-similar-rows';

// Submission
export {
  createImportChunks,
  computeContentHash,
  computeBatchHash,
} from './submission/import-chunks';

// Anonymization
export { anonymizeTitle, processRows } from './anonymization/pipeline';
export { buildFromStubs } from './anonymization/dictionaries/stub-builder';
export { createDictionaryProvider } from './anonymization/dictionaries/dictionary-provider.factory';
export { devDictionaryProvider } from './anonymization/dictionaries/dev-provider';

// Types (re-export from barrel)
export type {
  CsvRow,
  ParsedCsvData,
  DateFormat,
  AmountLocale,
  ParserConfig,
  ReassemblyStrategyType,
  ReassemblyConfig,
  ReassemblyStrategy,
  DomainField,
  ColumnMapping,
  MappingProfile,
  BankProfile,
  RowStatus,
  TransactionRow,
  WizardStep,
  ImportStats,
  UserCorrection,
  PiiType,
  DetectionSpan,
  PiiDetector,
  DictionaryType,
  DictionarySet,
  DictionaryProvider,
  AnonymizationStatus,
  AnonymizationEntry,
  TransactionType,
  ImportRowPayload,
  ImportChunkPayload,
  ImportChunkResult,
  ImportProgress,
} from './types';
