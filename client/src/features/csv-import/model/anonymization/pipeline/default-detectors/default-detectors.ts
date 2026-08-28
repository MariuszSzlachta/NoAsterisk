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
import type { PiiDetector } from '#features/csv-import/model/anonymization/types/pii-detector';

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
