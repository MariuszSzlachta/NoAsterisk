import type { PiiType } from '#features/csv-import/model/anonymization/types/pii-type';

export interface DetectionSpan {
  readonly start: number;
  readonly end: number;
  readonly type: PiiType;
  readonly confidence: number;
  readonly original: string;
  readonly detectorId: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
