// CSV Import Model — Public API
// Re-exports from all sub-modules for unified access.

// Parsing
export { parseCsvFile, CsvParseError } from './parsing/csv-parser';
export { detectDateFormat, parseDate, parseDateFlexible } from './parsing/date-parser';
export { detectAmountLocale, parseAmount } from './parsing/amount-parser';
export {
  detectEncoding,
  decodeBuffer,
  decodeBufferWithWarning,
  countReplacementChars,
} from './parsing/encoding-detector';
export type { DecodeWarning } from './parsing/encoding-detector';
export { detectSeparator } from './parsing/separator-detector';
export { detectDataBoundaries } from './parsing/data-boundary-detector';

// Column Mapping
export { autoDetectMapping, normalizeHeader, isDomainField, hasRequiredFields } from './column-mapping/column-mapper';
export { HeaderHeuristicRegistry, defaultHeaderHeuristicRegistry } from './column-mapping/heuristics';
export type { HeaderHeuristic } from './column-mapping/heuristics';
export { BankProfileRegistry, defaultBankProfileRegistry, detectBankFromHeaders } from './column-mapping/bank-profiles';

// Transformation
export { transformRows } from './transformation/row-transformer';
export { detectDuplicatesInBatch, detectDuplicatesAgainstExisting } from './transformation/duplicate-detector';
export { findSimilarRows } from './transformation/find-similar-rows';

// Submission
export { createImportChunks, computeContentHash, computeBatchHash } from './submission/import-chunks';

// Anonymization
export { anonymizeTitle, processRows } from './anonymization/pipeline';
export { createDictionaryProvider, devDictionaryProvider } from './anonymization/dictionaries/dictionary.provider';

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
