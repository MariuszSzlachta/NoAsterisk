import { DictionaryType } from '@dictionaries/domain/dictionary-type.enum';

const DICTIONARY_TYPE_VALUES: ReadonlySet<string> = new Set(
  Object.values(DictionaryType),
);

export const isDictionaryType = (value: unknown): value is DictionaryType =>
  typeof value === 'string' && DICTIONARY_TYPE_VALUES.has(value);
