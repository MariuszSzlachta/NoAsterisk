import type { MaskFn } from './mask-fn';

export const maskPhone: MaskFn = (s) => {
  const digits = s.replace(/\D/g, '');
  return `••• ••• ${digits.slice(-3)}`;
};
