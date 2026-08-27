import type { MaskFn } from './mask-fn';

export const maskNip: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `${digits.slice(0, 3)}-•••-••-${digits.slice(-2)}`;
};
