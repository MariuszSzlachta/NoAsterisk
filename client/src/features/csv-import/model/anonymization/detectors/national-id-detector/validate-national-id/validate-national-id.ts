import { ID_WEIGHTS } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/id-weights';
import { LETTER_COUNT } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/letter-count';
import { DIGIT_COUNT } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/digit-count';
import { LETTER_CODE_BASE } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/letter-code-base';
import { RADIX } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/radix';
import { CHECKSUM_INDEX } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/checksum-index';
import { CHECKSUM_MODULO } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/checksum-modulo';

export const validateNationalId = (
  letters: string,
  digits: string,
): boolean => {
  if (letters.length !== LETTER_COUNT || digits.length !== DIGIT_COUNT) {
    return false;
  }

  const values = [
    ...Array.from(letters, (ch) => ch.charCodeAt(0) - LETTER_CODE_BASE),
    ...Array.from(digits, (ch) => parseInt(ch, RADIX)),
  ];

  let sum = 0;
  for (let i = 0; i < ID_WEIGHTS.length; i += 1) {
    if (i === CHECKSUM_INDEX) {
      continue;
    }
    const v = values[i];
    const weight = ID_WEIGHTS[i];
    if (v !== undefined && weight !== undefined) {
      sum += v * weight;
    }
  }

  const checkValue = values[CHECKSUM_INDEX];
  return checkValue !== undefined && sum % CHECKSUM_MODULO === checkValue;
};
