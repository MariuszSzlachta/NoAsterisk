import type { PiiDetector } from '#features/csv-import/model/anonymization/types';
import { addressDetector } from '#features/csv-import/model/anonymization/detectors/address-detector';
import { birthDateDetector } from '#features/csv-import/model/anonymization/detectors/birth-date-detector';
import { cardDetector } from '#features/csv-import/model/anonymization/detectors/card-detector';
import { emailDetector } from '#features/csv-import/model/anonymization/detectors/email-detector';
import { ibanDetector } from '#features/csv-import/model/anonymization/detectors/iban-detector';
import { nameDetector } from '#features/csv-import/model/anonymization/detectors/name-detector';
import { nationalIdDetector } from '#features/csv-import/model/anonymization/detectors/national-id-detector';
import { nipDetector } from '#features/csv-import/model/anonymization/detectors/nip-detector';
import { peselDetector } from '#features/csv-import/model/anonymization/detectors/pesel-detector';
import { phoneDetector } from '#features/csv-import/model/anonymization/detectors/phone-detector';

export const DEFAULT_DETECTORS: readonly PiiDetector[] = [
  peselDetector,
  ibanDetector,
  cardDetector,
  nipDetector,
  phoneDetector,
  nationalIdDetector,
  emailDetector,
  birthDateDetector,
  nameDetector,
  addressDetector,
];

export const buildPriorityMap = (
  detectors: readonly PiiDetector[],
): ReadonlyMap<string, number> => {
  const entries = detectors.map((d) => [d.id, d.priority] as const);
  const ids = entries.map(([id]) => id);
  const duplicateId = ids.find((id, i) => ids.indexOf(id) !== i);

  if (duplicateId !== undefined) {
    throw new Error(
      `Duplicate detector id: '${duplicateId}'. Each detector must have a unique id.`,
    );
  }

  return new Map(entries);
};
