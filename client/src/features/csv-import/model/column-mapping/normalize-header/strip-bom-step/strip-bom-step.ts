import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

export const stripBom: NormalizeStep = (s) => s.replace(/^\uFEFF/, '');
