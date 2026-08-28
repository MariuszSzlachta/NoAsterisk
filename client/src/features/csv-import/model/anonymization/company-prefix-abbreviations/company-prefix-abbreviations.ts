import { COMPANY_FORM_VARIANTS } from '#features/csv-import/model/anonymization/constants/company-form-variants';
import { MAX_ABBREVIATION_LENGTH } from '#features/csv-import/model/anonymization/company-prefix-abbreviations/constants/max-abbreviation-length';
import { DOT_PATTERN } from '#features/csv-import/model/anonymization/company-prefix-abbreviations/constants/dot-pattern';
import { SHORT_FORM_PREFIXES } from '#features/csv-import/model/anonymization/company-prefix-abbreviations/constants/short-form-prefixes';

export const COMPANY_PREFIX_ABBREVIATIONS = COMPANY_FORM_VARIANTS.filter(
  (v) =>
    (v.length <= MAX_ABBREVIATION_LENGTH && DOT_PATTERN.test(v)) || SHORT_FORM_PREFIXES.includes(v),
);
