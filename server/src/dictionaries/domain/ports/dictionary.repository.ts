import { DictionaryEntry } from '@dictionaries/domain/dictionary-entry.entity';
import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';

export const DICTIONARY_REPOSITORY = Symbol('DICTIONARY_REPOSITORY');

/**
 * Dictionary entries are global reference data (not workspace-scoped).
 * ARCH-EXCEPTION: global-scope — dictionaries are shared PII detection data,
 * not user financial data. Accepted permanently.
 */
export interface DictionaryRepository {
  findByType(type: DictionaryType): Promise<ReadonlyArray<DictionaryEntry>>;
  findAll(): Promise<ReadonlyArray<DictionaryEntry>>;
  findById(id: string): Promise<DictionaryEntry | undefined>;
  save(entry: DictionaryEntry): Promise<DictionaryEntry>;
  saveBatch(entries: ReadonlyArray<DictionaryEntry>): Promise<number>;
  delete(id: string): Promise<void>;
  existsByTypeAndValue(type: DictionaryType, value: string): Promise<boolean>;
}
