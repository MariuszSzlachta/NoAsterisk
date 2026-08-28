import type { PiiType } from '#features/csv-import/model/anonymization/types';

import { maskAddress } from '#features/csv-import/model/anonymization/masker/mask-address';
import { maskBirthDate } from '#features/csv-import/model/anonymization/masker/mask-birth-date';
import { maskCard } from '#features/csv-import/model/anonymization/masker/mask-card';
import { maskEmail } from '#features/csv-import/model/anonymization/masker/mask-email';
import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';
import { maskIban } from '#features/csv-import/model/anonymization/masker/mask-iban';
import { maskName } from '#features/csv-import/model/anonymization/masker/mask-name';
import { maskNationalId } from '#features/csv-import/model/anonymization/masker/mask-national-id';
import { maskNip } from '#features/csv-import/model/anonymization/masker/mask-nip';
import { maskPesel } from '#features/csv-import/model/anonymization/masker/mask-pesel';
import { maskPhone } from '#features/csv-import/model/anonymization/masker/mask-phone';

export const MASK_STRATEGIES: Record<PiiType, MaskFn> = {
  iban: maskIban,
  card: maskCard,
  pesel: maskPesel,
  nip: maskNip,
  national_id: maskNationalId,
  birth_date: maskBirthDate,
  name: maskName,
  phone: maskPhone,
  email: maskEmail,
  address: maskAddress,
};
