import { validateMod97 } from '#features/csv-import/model/anonymization/detectors/iban-detector/validate-mod97';

export const validateBarePl = (digits: string): boolean => {
  const cleaned = digits.replace(/\s/g, '');
  if (cleaned.length !== 26) {
    return false;
  }
  return validateMod97('PL' + cleaned);
};
