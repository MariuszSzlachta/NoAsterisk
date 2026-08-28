import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

export const stripSurroundingQuotes: NormalizeStep = (s) =>
  s.replace(/^["']+|["']+$/g, '');
