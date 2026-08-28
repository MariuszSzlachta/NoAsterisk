import { ID_CONTEXT } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/id-context';
import { ID_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants/id-lookback';

export const hasIdContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - ID_LOOKBACK), start).toLowerCase();
  return ID_CONTEXT.some((kw) => prefix.includes(kw));
};
