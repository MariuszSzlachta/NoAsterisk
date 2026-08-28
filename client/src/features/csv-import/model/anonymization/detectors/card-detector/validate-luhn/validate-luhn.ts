import { MIN_CARD_DIGITS } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/min-card-digits';
import { MAX_CARD_DIGITS } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/max-card-digits';
import { LUHN_DOUBLE_THRESHOLD } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/luhn-double-threshold';
import { LUHN_MODULO } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/luhn-modulo';
import { RADIX } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/radix';
import { DOUBLE_FACTOR } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/double-factor';

export const validateLuhn = (digits: string): boolean => {
  if (digits.length < MIN_CARD_DIGITS || digits.length > MAX_CARD_DIGITS) {
    return false;
  }

  const sum = Array.from(digits)
    .reverse()
    .reduce((acc, char, idx) => {
      const n = parseInt(char, RADIX);
      if (idx % DOUBLE_FACTOR === 0) {
        return acc + n;
      }
      const doubled = n * DOUBLE_FACTOR;
      return acc + (doubled > LUHN_DOUBLE_THRESHOLD ? doubled - LUHN_DOUBLE_THRESHOLD : doubled);
    }, 0);

  return sum % LUHN_MODULO === 0;
};
