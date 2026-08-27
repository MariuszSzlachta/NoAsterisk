import type { NormalizeStep } from '#features/csv-import/model/column-mapping/types';

export const stripLeadingHash: NormalizeStep = (s) => s.replace(/^#+\s*/, '');
