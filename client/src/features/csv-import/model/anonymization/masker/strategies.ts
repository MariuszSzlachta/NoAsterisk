import type { PiiType } from '#features/csv-import/model/anonymization/types';

import {
  CARD_MIN_DIGITS_FOR_FULL_MASK,
  NAME_MAX_BULLET_LENGTH,
} from './constants';

export type MaskFn = (original: string) => string;

export const maskIban: MaskFn = (s) => {
  const clean = s.replace(/^'/, '').replace(/\s/g, '');
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
};

export const maskCard: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  if (digits.length >= CARD_MIN_DIGITS_FOR_FULL_MASK) {
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
  }
  return `•••• •••• •••• ${s.slice(-4)}`;
};

export const maskPesel: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `${digits.slice(0, 2)}•••••••${digits.slice(-2)}`;
};

export const maskNip: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `${digits.slice(0, 3)}-•••-••-${digits.slice(-2)}`;
};

export const maskNationalId: MaskFn = (s) => `${s.slice(0, 3)} ••••••`;

export const maskBirthDate: MaskFn = () => 'ur. ••.••.••••';

export const maskName: MaskFn = (s) =>
  s
    .split(/[\s-]+/)
    .filter((p) => p.length > 0)
    .map(
      (p) =>
        `${p[0]}${'•'.repeat(Math.min(p.length - 1, NAME_MAX_BULLET_LENGTH))}`,
    )
    .join(' ');

export const maskPhone: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `••• ••• ${digits.slice(-3)}`;
};

export const maskEmail: MaskFn = (s) => {
  const atIdx = s.indexOf('@');
  if (atIdx <= 0) {
    return '•••@•••';
  }
  return `${s[0]}•••@${s.slice(atIdx + 1)}`;
};

export const maskAddress: MaskFn = (s) => {
  const prefix = s.match(/^(ul\.|al\.|os\.|pl\.|\d{2}-\d{3})/i);
  return prefix ? `${prefix[0]} •••` : '••• •••';
};

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
