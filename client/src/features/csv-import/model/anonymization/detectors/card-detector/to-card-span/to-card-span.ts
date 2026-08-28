import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import { CARD_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/card-detector/constants/card-detector-id';

export const toCardSpan = (
  match: RegExpMatchArray,
  confidence: number,
  metadata: Readonly<Record<string, unknown>>,
): DetectionSpan => ({
  start: match.index ?? 0,
  end: (match.index ?? 0) + match[0].length,
  type: 'card',
  confidence,
  original: match[0],
  detectorId: CARD_DETECTOR_ID,
  metadata,
});
