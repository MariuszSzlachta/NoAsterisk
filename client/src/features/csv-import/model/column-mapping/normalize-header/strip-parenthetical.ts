import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';

export const stripParenthetical: NormalizeStep = (s) =>
  s.replace(/\s*\([^)]*\)\s*$/, '');
