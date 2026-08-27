import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';

export const collapseWhitespace: NormalizeStep = (s) =>
  s.replace(/\s+/g, ' ').trim();
