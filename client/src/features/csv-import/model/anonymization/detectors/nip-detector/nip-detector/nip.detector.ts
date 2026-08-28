import { overlapsAny } from '#features/csv-import/model/anonymization/detectors/shared';
import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { COMPACT_WITH_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/compact-with-context-confidence';
import { DASHED_NO_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/dashed-no-context-confidence';
import { DASHED_WITH_CONTEXT_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/dashed-with-context-confidence';
import { NIP_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-detector-id';
import { NIP_PRIORITY } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/nip-priority';
import { DASH_PATTERN } from '#features/csv-import/model/anonymization/detectors/nip-detector/constants/dash-pattern';
import { createNipCompactPattern } from '#features/csv-import/model/anonymization/detectors/nip-detector/create-nip-compact-pattern';
import { createNipDashedPattern } from '#features/csv-import/model/anonymization/detectors/nip-detector/create-nip-dashed-pattern';
import { hasNipContext } from '#features/csv-import/model/anonymization/detectors/nip-detector/has-nip-context';
import { validateNip } from '#features/csv-import/model/anonymization/detectors/nip-detector/validate-nip';

export const nipDetector: PiiDetector = {
  id: NIP_DETECTOR_ID,
  priority: NIP_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    const dashedSpans = Array.from(text.matchAll(createNipDashedPattern()))
      .filter((match) => validateNip(match[0].replace(DASH_PATTERN, '')))
      .map((match): DetectionSpan => {
        const hasContext = hasNipContext(text, match.index);
        return {
          start: match.index,
          end: match.index + match[0].length,
          type: 'nip',
          confidence: hasContext
            ? DASHED_WITH_CONTEXT_CONFIDENCE
            : DASHED_NO_CONTEXT_CONFIDENCE,
          original: match[0],
          detectorId: NIP_DETECTOR_ID,
          metadata: { checksumValid: true },
        };
      });

    const compactSpans = Array.from(text.matchAll(createNipCompactPattern()))
      .filter(
        (match) =>
          !overlapsAny(dashedSpans, match.index, match.index + match[0].length),
      )
      .filter((match) => validateNip(match[0]))
      .filter((match) => hasNipContext(text, match.index))
      .map(
        (match): DetectionSpan => ({
          start: match.index,
          end: match.index + match[0].length,
          type: 'nip',
          confidence: COMPACT_WITH_CONTEXT_CONFIDENCE,
          original: match[0],
          detectorId: NIP_DETECTOR_ID,
          metadata: { checksumValid: true },
        }),
      );

    return [...dashedSpans, ...compactSpans];
  },
};
