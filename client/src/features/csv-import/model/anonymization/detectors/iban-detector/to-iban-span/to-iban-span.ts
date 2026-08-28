import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { IBAN_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/iban-detector/constants/iban-detector-id';

export const toIbanSpan = (
  match: RegExpMatchArray,
  confidence: number,
  metadata: Readonly<Record<string, unknown>>,
): DetectionSpan => ({
  start: match.index ?? 0,
  end: (match.index ?? 0) + match[0].length,
  type: 'iban',
  confidence,
  original: match[0],
  detectorId: IBAN_DETECTOR_ID,
  metadata,
});
