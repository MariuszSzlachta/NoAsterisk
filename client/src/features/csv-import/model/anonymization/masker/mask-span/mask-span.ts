import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { MASK_STRATEGIES } from '#features/csv-import/model/anonymization/masker/mask-strategies';

export const maskSpan = (span: DetectionSpan): string => {
  const strategy = MASK_STRATEGIES[span.type];
  return strategy(span.original);
};
