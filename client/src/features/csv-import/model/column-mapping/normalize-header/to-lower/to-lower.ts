import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

export const toLower: NormalizeStep = (s) => s.toLowerCase();
