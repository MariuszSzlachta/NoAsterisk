import type { NormalizeStep } from '#features/csv-import/model/column-mapping/normalize-step';

export const stripLeadingHash: NormalizeStep = (s) => s.replace(/^#+\s*/, '');
