import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { ADDRESS_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/address-detector/constants/address-detector-id';

export const toAddressSpan = (
  match: RegExpMatchArray,
  confidence: number,
): DetectionSpan => ({
  start: match.index ?? 0,
  end: (match.index ?? 0) + match[0].length,
  type: 'address',
  confidence,
  original: match[0],
  detectorId: ADDRESS_DETECTOR_ID,
});
