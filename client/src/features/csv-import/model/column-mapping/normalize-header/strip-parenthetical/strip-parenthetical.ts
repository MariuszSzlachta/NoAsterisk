import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

export const stripParenthetical: NormalizeStep = (s) =>
  s.replace(/\s*\([^)]*\)\s*$/, '');
