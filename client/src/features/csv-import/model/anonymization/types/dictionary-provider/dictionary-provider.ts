import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';

export interface DictionaryProvider {
  loadAll(): Promise<DictionarySet>;
  isLoaded(): boolean;
  isStubFallback(): boolean;
}
