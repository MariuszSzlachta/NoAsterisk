import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';

export const stripSurroundingQuotes: NormalizeStep = (s) =>
  s.replace(/^["']+|["']+$/g, '');
