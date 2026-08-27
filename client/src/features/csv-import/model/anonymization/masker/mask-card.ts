import { CARD_MIN_DIGITS_FOR_FULL_MASK } from './card-min-digits-for-full-mask';
import type { MaskFn } from './mask-fn';

export const maskCard: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  if (digits.length >= CARD_MIN_DIGITS_FOR_FULL_MASK) {
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
  }
  return `•••• •••• •••• ${s.slice(-4)}`;
};
