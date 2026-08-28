import { overlapsAny } from '#features/csv-import/model/anonymization/detectors/shared';
import type {
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '#features/csv-import/model/anonymization/types';

import {
  COMPACT_WITH_CONTEXT_CONFIDENCE,
  DASHED_NO_CONTEXT_CONFIDENCE,
  DASHED_WITH_CONTEXT_CONFIDENCE,
} from '#features/csv-import/model/anonymization/detectors/nip-detector/constants';
import { createNipCompactPattern } from '#features/csv-import/model/anonymization/detectors/nip-detector/create-nip-compact-pattern';
import { createNipDashedPattern } from '#features/csv-import/model/anonymization/detectors/nip-detector/create-nip-dashed-pattern';
import { hasNipContext } from '#features/csv-import/model/anonymization/detectors/nip-detector/has-nip-context';
import { validateNip } from '#features/csv-import/model/anonymization/detectors/nip-detector/validate-nip';

export const nipDetector: PiiDetector = {
  id: 'nip',
  priority: 86,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const dashedPattern = createNipDashedPattern();
    const dashedSpans = Array.from(text.matchAll(dashedPattern))
      .filter((match) => validateNip(match[0].replace(/-/g, '')))
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
          detectorId: 'nip',
          metadata: { checksumValid: true },
        };
      });

    const compactPattern = createNipCompactPattern();
    const compactSpans = Array.from(text.matchAll(compactPattern))
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
          detectorId: 'nip',
          metadata: { checksumValid: true },
        }),
      );

    return [...dashedSpans, ...compactSpans];
  },
};
