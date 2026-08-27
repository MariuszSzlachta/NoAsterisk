import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';

export const toLower: NormalizeStep = (s) => s.toLowerCase();
