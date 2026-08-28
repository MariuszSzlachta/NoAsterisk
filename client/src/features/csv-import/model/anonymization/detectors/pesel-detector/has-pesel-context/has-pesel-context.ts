import { PESEL_CONTEXT } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants';

export const hasPeselContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 25), start).toLowerCase();
  return PESEL_CONTEXT.some((kw) => prefix.includes(kw));
};
