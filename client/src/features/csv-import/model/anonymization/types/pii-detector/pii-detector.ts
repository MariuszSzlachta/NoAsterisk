import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { DictionarySet } from '#features/csv-import/model/anonymization/types/dictionary-set';

export interface PiiDetector {
  readonly id: string;
  readonly priority: number;
  detect(text: string, dictionaries: DictionarySet): readonly DetectionSpan[];
}
