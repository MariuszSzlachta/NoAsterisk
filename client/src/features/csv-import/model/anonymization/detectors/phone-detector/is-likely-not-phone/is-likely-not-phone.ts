import { PHONE_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/phone-lookback';
import { EXCLUSION_PATTERNS } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/exclusion-patterns';
import { ALPHA_TRAILING_PATTERN } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/alpha-trailing-pattern';

export const isLikelyNotPhone = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - PHONE_LOOKBACK), start).toLowerCase();

  if (EXCLUSION_PATTERNS.some((pattern) => pattern.test(prefix))) {
    return true;
  }

  return start > 0 && ALPHA_TRAILING_PATTERN.test(text.slice(start - 1, start));
};
