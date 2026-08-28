import { COMPANY_FORM_VARIANTS } from '#features/csv-import/model/anonymization/constants/company-form-variants';

export const hasCompanyContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return COMPANY_FORM_VARIANTS.some((cp) => prefix.includes(cp));
};
