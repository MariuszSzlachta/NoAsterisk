import { MIN_IBAN_LENGTH } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/min-iban-length';
import { MAX_IBAN_LENGTH } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/max-iban-length';
import { MOD97_DIVISOR } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/mod97-divisor';
import { MOD97_VALID_REMAINDER } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/mod97-valid-remainder';
import { IBAN_BBAN_OFFSET } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/iban-bban-offset';
import { IBAN_CHUNK_SIZE } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/iban-chunk-size';
import { LETTER_CODE_OFFSET } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/letter-code-offset';
import { LETTER_CODE_START } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/letter-code-start';
import { LETTER_CODE_END } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/letter-code-end';
import { WHITESPACE_PATTERN } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/whitespace-pattern';
import { RADIX } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/radix';

export const validateMod97 = (iban: string): boolean => {
  const cleaned = iban.replace(WHITESPACE_PATTERN, '');
  if (cleaned.length < MIN_IBAN_LENGTH || cleaned.length > MAX_IBAN_LENGTH) {
    return false;
  }

  const rearranged = cleaned.slice(IBAN_BBAN_OFFSET) + cleaned.slice(0, IBAN_BBAN_OFFSET);
  const numericStr = Array.from(rearranged)
    .map((c) => {
      const code = c.charCodeAt(0);
      if (code >= LETTER_CODE_START && code <= LETTER_CODE_END) {
        return String(code - LETTER_CODE_OFFSET);
      }
      return c;
    })
    .join('');

  const chunkIndices = Array.from(
    { length: Math.ceil(numericStr.length / IBAN_CHUNK_SIZE) },
    (_, i) => i * IBAN_CHUNK_SIZE,
  );

  const remainder = chunkIndices.reduce(
    (rem, i) => parseInt(String(rem) + numericStr.slice(i, i + IBAN_CHUNK_SIZE), RADIX) % MOD97_DIVISOR,
    0,
  );

  return remainder === MOD97_VALID_REMAINDER;
};
