import type { DictionaryType } from '#features/admin/model/types/dictionary-type';
import { DICTIONARY_TYPES } from '#features/admin/ui/hooks/useDictionariesTab/constants/dictionary-types';

export const isDictionaryType = (value: string): value is DictionaryType =>
  DICTIONARY_TYPES.some((t) => t === value);
