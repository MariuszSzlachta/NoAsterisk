import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';

export const stripBom: NormalizeStep = (s) => s.replace(/^\uFEFF/, '');
