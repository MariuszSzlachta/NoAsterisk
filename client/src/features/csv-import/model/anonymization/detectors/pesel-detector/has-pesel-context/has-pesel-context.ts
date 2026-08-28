import { PESEL_CONTEXT } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-context';
import { PESEL_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/pesel-detector/constants/pesel-lookback';

export const hasPeselContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - PESEL_LOOKBACK), start).toLowerCase();
  return PESEL_CONTEXT.some((kw) => prefix.includes(kw));
};
