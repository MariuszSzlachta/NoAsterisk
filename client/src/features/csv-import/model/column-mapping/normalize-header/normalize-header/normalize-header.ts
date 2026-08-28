import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

import { DEFAULT_NORMALIZE_STEPS } from '#features/csv-import/model/column-mapping/normalize-header/default-normalize-steps';

export const normalizeHeader = (
  header: string,
  steps: readonly NormalizeStep[] = DEFAULT_NORMALIZE_STEPS,
): string => steps.reduce((result, step) => step(result), header);
