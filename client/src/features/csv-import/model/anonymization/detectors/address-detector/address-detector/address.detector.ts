import type { DetectionSpan } from '#features/csv-import/model/anonymization/types/detection-span';
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';
import { createAddressPattern } from '#features/csv-import/model/anonymization/detectors/address-detector/create-address-pattern';
import { createPostalCodePattern } from '#features/csv-import/model/anonymization/detectors/address-detector/create-postal-code-pattern';
import { POSTAL_CODE_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/address-detector/constants/postal-code-confidence';
import { STREET_CONFIDENCE } from '#features/csv-import/model/anonymization/detectors/address-detector/constants/street-confidence';
import { ADDRESS_PRIORITY } from '#features/csv-import/model/anonymization/detectors/address-detector/constants/address-priority';
import { ADDRESS_DETECTOR_ID } from '#features/csv-import/model/anonymization/detectors/address-detector/constants/address-detector-id';
import { toAddressSpan } from '#features/csv-import/model/anonymization/detectors/address-detector/to-span';

export const addressDetector: PiiDetector = {
  id: ADDRESS_DETECTOR_ID,
  priority: ADDRESS_PRIORITY,

  detect(text: string): readonly DetectionSpan[] {
    const streetSpans = Array.from(text.matchAll(createAddressPattern()), (m) =>
      toAddressSpan(m, STREET_CONFIDENCE),
    );

    const postalSpans = Array.from(text.matchAll(createPostalCodePattern()))
      .filter((m) => {
        const start = m.index ?? 0;
        const end = start + m[0].length;
        return !streetSpans.some((s) => start < s.end && end > s.start);
      })
      .map((m) => toAddressSpan(m, POSTAL_CODE_CONFIDENCE));

    return [...streetSpans, ...postalSpans];
  },
};
