import { validateMod97 } from '#features/csv-import/model/anonymization/detectors/iban-detector/validate-mod97';
import { WHITESPACE_PATTERN } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/whitespace-pattern';
import { PL_ACCOUNT_LENGTH } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/pl-account-length';
import { PL_COUNTRY_CODE } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/pl-country-code';

export const validateBarePl = (digits: string): boolean => {
  const cleaned = digits.replace(WHITESPACE_PATTERN, '');
  if (cleaned.length !== PL_ACCOUNT_LENGTH) {
    return false;
  }
  return validateMod97(PL_COUNTRY_CODE + cleaned);
};
