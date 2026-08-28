import type { DetectionSpan } from '#features/csv-import/model/anonymization/types';

import { MASK_STRATEGIES } from '#features/csv-import/model/anonymization/masker/mask-strategies';

/**
 * Mask a single detected PII span using type-specific strategy.
 */
export const maskSpan = (span: DetectionSpan): string => {
  const strategy = MASK_STRATEGIES[span.type];
  return strategy(span.original);
};
