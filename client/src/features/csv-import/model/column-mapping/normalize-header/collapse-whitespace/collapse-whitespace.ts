import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

export const collapseWhitespace: NormalizeStep = (s) =>
  s.replace(/\s+/g, ' ').trim();
