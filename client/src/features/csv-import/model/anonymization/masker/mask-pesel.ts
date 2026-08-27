import type { MaskFn } from './mask-fn';

export const maskPesel: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `${digits.slice(0, 2)}•••••••${digits.slice(-2)}`;
};
