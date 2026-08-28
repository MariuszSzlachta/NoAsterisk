import { NIP_WEIGHTS } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-weights';
import { NIP_LENGTH } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-length';
import { NIP_CHECKSUM_MODULO } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-checksum-modulo';
import { NIP_INVALID_CHECKSUM } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-invalid-checksum';
import { NIP_CHECK_DIGIT_INDEX } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-check-digit-index';
import { RADIX } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/radix';
import { DEFAULT_DIGIT } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/default-digit';
import { INVALID_CHECK } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/invalid-check';

export const validateNip = (digits: string): boolean => {
  if (digits.length !== NIP_LENGTH) {
    return false;
  }

  const sum = NIP_WEIGHTS.reduce(
    (acc, weight, i) => acc + parseInt(digits[i] ?? DEFAULT_DIGIT, RADIX) * weight,
    0,
  );

  const checkDigit = sum % NIP_CHECKSUM_MODULO;
  if (checkDigit === NIP_INVALID_CHECKSUM) {
    return false;
  }

  return checkDigit === parseInt(digits[NIP_CHECK_DIGIT_INDEX] ?? INVALID_CHECK, RADIX);
};
