import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskNip: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `${digits.slice(0, 3)}-•••-••-${digits.slice(-2)}`;
};
