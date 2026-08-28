import type { MaskFn } from '#features/csv-import/model/anonymization/masker/mask-fn';

export const maskIban: MaskFn = (s) => {
  const clean = s.replace(/^'/, '').replace(/\s/g, '');
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
};
