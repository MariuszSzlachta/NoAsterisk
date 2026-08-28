import { NIP_CONTEXT } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants';

export const hasNipContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - 20), start).toLowerCase();
  return NIP_CONTEXT.some((kw) => prefix.includes(kw));
};
