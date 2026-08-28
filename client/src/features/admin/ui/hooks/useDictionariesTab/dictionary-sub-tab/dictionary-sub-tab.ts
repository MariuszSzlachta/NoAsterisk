import type { DictionaryType } from '#features/admin/model/types/dictionary-type';

export interface DictionarySubTab {
  readonly id: DictionaryType;
  readonly label: string;
  readonly count: number;
}
