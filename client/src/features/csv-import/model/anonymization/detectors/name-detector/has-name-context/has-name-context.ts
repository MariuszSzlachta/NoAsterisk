import { NAME_CONTEXT_KEYWORDS } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/name-context-keywords';
import { NAME_CONTEXT_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/name-detector/constants/name-context-lookback';

export const hasNameContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - NAME_CONTEXT_LOOKBACK), start).toLowerCase();
  return NAME_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};
