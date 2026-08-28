import { NAME_CONTEXT_KEYWORDS } from '#features/csv-import/model/anonymization/detectors/name-detector/constants';

export const hasNameContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return NAME_CONTEXT_KEYWORDS.some((kw) => prefix.includes(kw));
};
