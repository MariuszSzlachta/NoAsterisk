// CSV Import — Public API
// Only these exports are available to pages and other features.

export { parseCsvFile, CsvParseError } from './model/parser/csv-parser';
export { detectDateFormat, parseDate, parseDateFlexible } from './model/parser/date-parser';
export { detectAmountLocale, parseAmount } from './model/parser/amount-parser';
export { autoDetectMapping } from './model/column-mapper';
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
