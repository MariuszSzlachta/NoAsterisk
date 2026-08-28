import { NIP_CONTEXT } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-context';
import { NIP_LOOKBACK } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-lookback';

export const hasNipContext = (text: string, start: number): boolean => {
  const prefix = text.slice(Math.max(0, start - NIP_LOOKBACK), start).toLowerCase();
  return NIP_CONTEXT.some((kw) => prefix.includes(kw));
};
