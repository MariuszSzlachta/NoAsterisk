import type { PiiType } from '#features/csv-import/model/anonymization/types';

import { maskAddress } from './mask-address';
import { maskBirthDate } from './mask-birth-date';
import { maskCard } from './mask-card';
import { maskEmail } from './mask-email';
import type { MaskFn } from './mask-fn';
import { maskIban } from './mask-iban';
import { maskName } from './mask-name';
import { maskNationalId } from './mask-national-id';
import { maskNip } from './mask-nip';
import { maskPesel } from './mask-pesel';
import { maskPhone } from './mask-phone';

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
