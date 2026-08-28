import { PHONE_CONTEXT_KEYWORDS } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/phone-context-keywords';
import { PHONE_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/phone-detector/constants/phone-lookback';

export const hasPhoneContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - PHONE_LOOKBACK), start).toLowerCase();
  return PHONE_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};
