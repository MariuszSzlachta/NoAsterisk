import { COMPANY_FORM_VARIANTS } from '#features/csv-import/model/anonymization/constants';

/**
 * Subset used for lookbehind context matching in name-detector.
 * Only short abbreviation forms (not full words like "spółka jawna")
 * that appear directly before names in bank titles.
 */
export const COMPANY_PREFIX_ABBREVIATIONS = COMPANY_FORM_VARIANTS.filter(
  (v) =>
    (v.length <= 12 && /[.]/.test(v)) || ['phu', 'fhu', 'pphu'].includes(v),
);
