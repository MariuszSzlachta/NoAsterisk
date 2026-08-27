import type { MaskFn } from './mask-fn';

export const maskIban: MaskFn = (s) => {
  const clean = s.replace(/^'/, '').replace(/\s/g, '');
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
};
