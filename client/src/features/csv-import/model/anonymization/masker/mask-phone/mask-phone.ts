import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskPhone: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `••• ••• ${digits.slice(-3)}`;
};
