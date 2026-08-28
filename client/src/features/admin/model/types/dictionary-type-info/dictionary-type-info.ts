import type { DictionaryType } from '#features/admin/model/types/dictionary-type';

export interface DictionaryTypeInfo {
  readonly type: DictionaryType;
  readonly count: number;
  readonly lastUpdated: string | undefined;
}
