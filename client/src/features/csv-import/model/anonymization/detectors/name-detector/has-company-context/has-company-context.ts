import { COMPANY_FORM_VARIANTS } from '#features/csv-import/model/anonymization/constants/company-form-variants';
import { COMPANY_PREFIX_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/company-prefix-lookback';

export const hasCompanyContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - COMPANY_PREFIX_LOOKBACK), start).toLowerCase();
  return COMPANY_FORM_VARIANTS.some((cp) => prefix.includes(cp));
};
