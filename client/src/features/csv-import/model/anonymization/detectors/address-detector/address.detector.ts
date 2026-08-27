import type {
  DetectionSpan,
  DictionarySet,
  PiiDetector,
} from '#features/csv-import/model/anonymization/types';

import { createAddressPattern } from './create-address-pattern';
import { createPostalCodePattern } from './create-postal-code-pattern';
import { POSTAL_CODE_CONFIDENCE } from './constants/postal-code-confidence';
import { STREET_CONFIDENCE } from './constants/street-confidence';

const toSpan = (
  match: RegExpMatchArray,
  confidence: number,
): DetectionSpan => ({
  start: match.index ?? 0,
  end: (match.index ?? 0) + match[0].length,
  type: 'address',
  confidence,
  original: match[0],
  detectorId: 'address',
});

export const addressDetector: PiiDetector = {
  id: 'address',
  priority: 40,

  detect(text: string, _dictionaries: DictionarySet): readonly DetectionSpan[] {
    const streetSpans = Array.from(text.matchAll(createAddressPattern()), (m) =>
      toSpan(m, STREET_CONFIDENCE),
    );

    const postalSpans = Array.from(text.matchAll(createPostalCodePattern()))
      .filter((m) => {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        return !streetSpans.some((s) => start < s.end && end > s.start);
      })
      .map((m) => toSpan(m, POSTAL_CODE_CONFIDENCE));

    return [...streetSpans, ...postalSpans];
  },
};
