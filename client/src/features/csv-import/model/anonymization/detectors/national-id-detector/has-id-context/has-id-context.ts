import { ID_CONTEXT } from '#features/csv-import/model/anonymization/detectors/national-id-detector/constants';

export const hasIdContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 30), start).toLowerCase();
  return ID_CONTEXT.some((kw) => prefix.includes(kw));
};
