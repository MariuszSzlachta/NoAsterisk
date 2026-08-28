import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskPesel: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `${digits.slice(0, 2)}•••••••${digits.slice(-2)}`;
};
