// CSV Import Model — Public API
// Re-exports from all sub-modules for unified access.

// Parsing
export { parseCsvFile } from './parsing/csv-parser/parse-csv-file';
export { CsvParseError } from './parsing/csv-parser/helpers/csv-parse-error';
export { detectDateFormat } from './parsing/date-parser/detect-date-format';
export { parseDate } from './parsing/date-parser/parse-date';
export { parseDateFlexible } from './parsing/date-parser/parse-date-flexible';
export { detectAmountLocale } from './parsing/amount-parser/detect-amount-locale';
export { parseAmount } from './parsing/amount-parser/parse-amount';
export { detectEncoding } from './parsing/encoding-detector/detect-encoding';
export { decodeBuffer } from './parsing/encoding-detector/decode-buffer';
export { decodeBufferWithWarning } from './parsing/encoding-detector/decode-buffer-with-warning';
export { countReplacementChars } from './parsing/encoding-detector/helpers/count-replacement-chars';
export type { DecodeWarning } from './parsing/types/decode-warning';
export { detectSeparator } from './parsing/separator-detector/detect-separator';
export { detectDataBoundaries } from './parsing/data-boundary-detector/detect-data-boundaries';

// Column Mapping
export { autoDetectMapping } from './column-mapping/auto-detect';
export { normalizeHeader } from './column-mapping/normalize-header';
export { isDomainField } from './column-mapping/validators/is-domain-field';
export { hasRequiredFields } from './column-mapping/validators/has-required-fields';
export { MERGEABLE_FIELDS } from './column-mapping/mergeable-fields';
export { createHeuristicRegistry } from './column-mapping/heuristics/create-heuristic-registry';
export { defaultHeuristicRegistry } from './column-mapping/heuristics/default-heuristic-registry';
export { createBankProfileRegistry } from './column-mapping/bank-profiles/create-bank-profile-registry';
export { defaultBankProfileRegistry } from './column-mapping/bank-profiles/default-bank-profile-registry';
export { detectBankFromHeaders } from './column-mapping/bank-profiles/detect-bank-from-headers';

// Transformation
export { transformRows } from './transformation/row-transformer';
export { detectDuplicatesInBatch } from './transformation/duplicate-detector/detect-duplicates-in-batch';
export { detectDuplicatesAgainstExisting } from './transformation/duplicate-detector/detect-duplicates-against-existing';
export { findSimilarRows } from './transformation/find-similar-rows';

// Local persistence
export { categorizeImportedTransactions } from './persistence/categorize-imported-transactions';
export { computeImportContentHash } from './persistence/compute-import-content-hash';
export { isImportableRow } from './persistence/is-importable-row';
export { mapImportRowToStoredTransaction } from './persistence/map-import-row-to-stored-transaction';
export { prepareImportedTransactions } from './persistence/prepare-imported-transactions';
export { saveImportedTransactions } from './persistence/save-imported-transactions';
export { selectAcceptedImportRows } from './persistence/select-accepted-import-rows';

// Anonymization
export { anonymizeTitle } from './anonymization/pipeline/anonymize-title';
export { processRows } from './anonymization/pipeline/process-rows';
export { buildFromStubs } from './anonymization/dictionaries/build-from-stubs';
export { createDictionaryProvider } from './anonymization/dictionaries/dictionary-provider-factory';
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
  ImportProgress,
} from './types';
